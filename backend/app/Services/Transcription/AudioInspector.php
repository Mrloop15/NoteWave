<?php

namespace App\Services\Transcription;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Process\Process;
use Throwable;

class AudioInspector
{
    /** Decode actual audio, including WebM without duration metadata, into bounded mono PCM. */
    public function inspect(UploadedFile $audio): array
    {
        $limit = (int) config('transcription.max_seconds');
        $process = new Process([
            config('transcription.ffmpeg'), '-hide_banner', '-loglevel', 'error', '-nostdin',
            '-max_alloc', '67108864', '-threads', '1', '-protocol_whitelist', 'file,pipe',
            '-format_whitelist', 'matroska,webm,mov,wav,ogg', '-i', $audio->getRealPath(),
            '-map', '0:a:0', '-vn', '-t', (string) ($limit + 1), '-ac', '1', '-ar', '16000',
            '-threads', '1', '-f', 's16le', 'pipe:1',
        ]);
        $process->setTimeout(20);
        try {
            $process->run();
        } catch (Throwable) {
            abort(503, 'El servicio de audio no está disponible. Puedes seguir escribiendo.');
        }
        if (! $process->isSuccessful()) {
            if ($process->getExitCode() === 127 || $process->getExitCode() === 1 && ! is_file(config('transcription.ffmpeg')) && PHP_OS_FAMILY === 'Windows') {
                abort(503, 'El servicio de audio no está disponible.');
            }
            throw ValidationException::withMessages(['audio' => 'No pudimos leer el audio. Graba de nuevo.']);
        }
        $pcm = $process->getOutput();
        $duration = strlen($pcm) / 32000;
        if ($duration < 0.25 || $duration > $limit) {
            throw ValidationException::withMessages(['audio' => 'La grabación debe durar entre 0,25 y '.$limit.' segundos.']);
        }
        $audible = false;
        foreach (str_split($pcm, 32000) as $chunk) {
            foreach (unpack('v*', $chunk) as $sample) {
                $signed = $sample > 32767 ? $sample - 65536 : $sample;
                if (abs($signed) > 32) {
                    $audible = true;
                    break 2;
                }
            }
        }
        if (! $audible) {
            throw ValidationException::withMessages(['audio' => 'La grabación está en silencio. Comprueba tu micrófono.']);
        }
        $wav = 'RIFF'.pack('V', 36 + strlen($pcm)).'WAVEfmt '.pack('VvvVVvv', 16, 1, 1, 16000, 32000, 2, 16).'data'.pack('V', strlen($pcm)).$pcm;

        return ['wav' => $wav, 'seconds' => (int) ceil($duration)];
    }
}
