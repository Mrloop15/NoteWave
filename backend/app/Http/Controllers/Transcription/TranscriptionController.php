<?php

namespace App\Http\Controllers\Transcription;

use App\Actions\Transcription\CreateTranscription;
use App\Actions\Transcription\DiscardTranscription;
use App\Http\Controllers\Controller;
use App\Http\Requests\Transcription\StoreTranscriptionRequest;
use App\Http\Resources\TranscriptionResource;
use App\Models\Transcription;
use Illuminate\Support\Facades\Gate;

class TranscriptionController extends Controller
{
    public function options()
    {
        return response()->json(['data' => [
            'enabled' => (bool) config('transcription.enabled') && config('transcription.driver') === 'simulated',
            'simulated' => true, 'max_seconds' => config('transcription.max_seconds'),
            'max_bytes' => config('transcription.max_kilobytes') * 1024, 'languages' => ['es', 'en'],
        ]]);
    }

    public function store(StoreTranscriptionRequest $request, CreateTranscription $action)
    {
        return (new TranscriptionResource($action->execute($request->user(), $request->file('audio'), $request->string('language')->toString(), $request->string('idempotency_key')->toString())))->response()->setStatusCode(202);
    }

    public function show(Transcription $transcription, DiscardTranscription $discard)
    {
        Gate::authorize('view', $transcription);
        if ($transcription->expires_at->isPast()) {
            $discard->execute($transcription, 'expired');
        } elseif (in_array($transcription->status, ['queued', 'processing'], true) && $transcription->created_at->lt(now()->subSeconds(config('transcription.processing_seconds')))) {
            $discard->execute($transcription, 'failed', 'processing_timeout');
        }

        return new TranscriptionResource($transcription->refresh());
    }

    public function destroy(Transcription $transcription, DiscardTranscription $discard)
    {
        Gate::authorize('delete', $transcription);
        $discard->execute($transcription);

        return response()->noContent();
    }
}
