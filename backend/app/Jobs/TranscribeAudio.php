<?php

namespace App\Jobs;

use App\Actions\Transcription\DiscardTranscription;
use App\Contracts\SpeechToTextProvider;
use App\Models\Transcription;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class TranscribeAudio implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 60;

    public bool $failOnTimeout = true;

    public function __construct(public string $transcriptionId) {}

    public function handle(SpeechToTextProvider $provider): void
    {
        $claimed = Transcription::whereKey($this->transcriptionId)->where('status', 'queued')
            ->where('expires_at', '>', now())->update(['status' => 'processing', 'updated_at' => now()]);
        if (! $claimed) {
            return;
        }
        $record = Transcription::find($this->transcriptionId);
        if (! $record) {
            return;
        }
        try {
            if (! config('transcription.enabled') || ! User::whereKey($record->user_id)->exists()) {
                app(DiscardTranscription::class)->execute($record);

                return;
            }
            $text = $provider->transcribe(Storage::disk('transcription')->path($record->audio_path), $record->language);
            DB::transaction(function () use ($text) {
                $current = Transcription::whereKey($this->transcriptionId)->lockForUpdate()->first();
                if (! $current || $current->status !== 'processing') {
                    return;
                }
                Storage::disk('transcription')->delete($current->audio_path);
                $empty = trim($text) === '';
                $current->forceFill([
                    'status' => $empty ? 'failed' : 'ready', 'audio_path' => null,
                    'transcript' => $empty ? null : mb_substr($text, 0, 20000),
                    'error_code' => $empty ? 'no_speech' : null,
                ])->save();
            }, 3);
        } catch (Throwable) {
            // Never serialize provider responses, paths, audio or text into failed-job errors.
            $current = Transcription::find($this->transcriptionId);
            if ($current && $current->status === 'processing') {
                app(DiscardTranscription::class)->execute($current, 'failed', 'provider_unavailable');
            }
        } finally {
            if ($record->audio_path) {
                Storage::disk('transcription')->delete($record->audio_path);
            }
        }
    }

    public function failed(?Throwable $exception): void
    {
        $record = Transcription::find($this->transcriptionId);
        if ($record && in_array($record->status, ['queued', 'processing'], true)) {
            app(DiscardTranscription::class)->execute($record, 'failed', 'processing_failed');
        }
    }
}
