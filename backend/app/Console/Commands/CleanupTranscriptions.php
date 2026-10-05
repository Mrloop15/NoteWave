<?php

namespace App\Console\Commands;

use App\Actions\Transcription\DiscardTranscription;
use App\Models\Transcription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupTranscriptions extends Command
{
    protected $signature = 'transcriptions:cleanup';

    protected $description = 'Remove expired transcripts, stalled work and orphaned private audio';

    public function handle(DiscardTranscription $discard): int
    {
        Transcription::where('status', '!=', 'expired')->where(fn ($query) => $query->where('expires_at', '<=', now())->orWhere(fn ($stalled) => $stalled->whereIn('status', ['queued', 'processing'])->where('created_at', '<', now()->subSeconds(config('transcription.processing_seconds')))))
            ->chunkById(100, function ($records) use ($discard) {
                foreach ($records as $record) {
                    $discard->execute($record, $record->expires_at->isPast() ? 'expired' : 'failed', $record->expires_at->isPast() ? null : 'processing_timeout');
                }
            });
        // Keep metadata beyond the UTC quota day; cancellation must not replenish quota.
        Transcription::where('created_at', '<', now()->subHours(48))->whereNull('audio_path')->whereNull('transcript')->delete();
        $disk = Storage::disk('transcription');
        foreach ($disk->files() as $path) {
            if ($disk->lastModified($path) < now()->subHour()->timestamp && ! Transcription::where('audio_path', $path)->exists()) {
                $disk->delete($path);
            }
        }
        $this->info('Transcription cleanup completed.');

        return self::SUCCESS;
    }
}
