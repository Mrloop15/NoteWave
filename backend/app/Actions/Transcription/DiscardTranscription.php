<?php

namespace App\Actions\Transcription;

use App\Models\Transcription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DiscardTranscription
{
    public function execute(Transcription $transcription, string $status = 'cancelled', ?string $error = null): void
    {
        DB::transaction(function () use ($transcription, $status, $error) {
            $current = Transcription::whereKey($transcription->id)->lockForUpdate()->first();
            if (! $current) {
                return;
            }
            // Leave the path in the row if deletion fails, so the cleanup command can retry.
            if ($current->audio_path) {
                Storage::disk('transcription')->delete($current->audio_path);
            }
            $current->forceFill(['status' => $status, 'transcript' => null, 'audio_path' => null, 'error_code' => $error])->save();
        }, 3);
    }
}
