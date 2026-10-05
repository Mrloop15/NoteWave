<?php

namespace App\Actions\Transcription;

use App\Jobs\TranscribeAudio;
use App\Models\Transcription;
use App\Models\User;
use App\Services\Transcription\AudioInspector;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CreateTranscription
{
    public function execute(User $user, UploadedFile $audio, string $language, string $key): Transcription
    {
        abort_unless(config('transcription.enabled') && config('transcription.driver') === 'simulated', 503, 'El dictado no está disponible. Puedes seguir escribiendo.');
        $hash = hash_file('sha256', $audio->getRealPath());
        $previous = Transcription::where('user_id', $user->id)->where('idempotency_key', $key)->first();
        if ($previous) {
            return $this->replay($previous, $hash, $language);
        }
        $decoded = app(AudioInspector::class)->inspect($audio);
        $path = Str::ulid().'.wav';
        $created = false;
        try {
            $result = DB::transaction(function () use ($user, $hash, $language, $key, $decoded, $path, &$created) {
                // A persistent owner row serializes quota, concurrency and idempotency together.
                User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                $previous = Transcription::where('user_id', $user->id)->where('idempotency_key', $key)->first();
                if ($previous) {
                    return $this->replay($previous, $hash, $language);
                }
                abort_if(Transcription::where('user_id', $user->id)->whereIn('status', ['queued', 'processing'])->exists(), 429, 'Ya tienes una transcripción en curso.');
                $used = Transcription::where('user_id', $user->id)->where('created_at', '>=', now()->startOfDay())->sum('duration_seconds');
                abort_if($used + $decoded['seconds'] > config('transcription.daily_seconds'), 429, 'Alcanzaste el límite diario de dictado.');
                Storage::disk('transcription')->put($path, $decoded['wav']);
                $result = Transcription::create([
                    'user_id' => $user->id, 'idempotency_key' => $key, 'audio_hash' => $hash,
                    'language' => $language, 'audio_path' => $path, 'duration_seconds' => $decoded['seconds'],
                    'status' => 'queued', 'expires_at' => now()->addHours(config('transcription.retention_hours')),
                ]);
                $created = true;

                return $result;
            }, 3);
        } catch (Throwable $error) {
            Storage::disk('transcription')->delete($path);
            throw $error;
        }
        if ($created) {
            try {
                TranscribeAudio::dispatch($result->id)->afterCommit();
            } catch (Throwable) {
                app(DiscardTranscription::class)->execute($result, 'failed', 'queue_unavailable');
                abort(503, 'No pudimos iniciar el dictado. Puedes seguir escribiendo.');
            }
        }

        return $result->refresh();
    }

    private function replay(Transcription $previous, string $hash, string $language): Transcription
    {
        abort_unless(hash_equals($previous->audio_hash, $hash) && $previous->language === $language, 409, 'La clave de envío ya se utilizó para otra grabación.');
        if ($previous->expires_at->isPast()) {
            app(DiscardTranscription::class)->execute($previous, 'expired');
            $previous->refresh();
        }

        return $previous;
    }
}
