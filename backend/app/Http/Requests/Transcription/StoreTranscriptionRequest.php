<?php

namespace App\Http\Requests\Transcription;

use App\Models\Transcription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreTranscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Transcription::class);
    }

    public function rules(): array
    {
        return [
            'audio' => ['required', 'file', 'max:'.config('transcription.max_kilobytes')],
            'language' => ['required', 'in:es,en'],
            'idempotency_key' => ['required', 'uuid'],
            'user_id' => ['prohibited'], 'status' => ['prohibited'], 'transcript' => ['prohibited'],
            'duration_seconds' => ['prohibited'], 'audio_path' => ['prohibited'],
        ];
    }
}
