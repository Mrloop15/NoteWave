<?php

namespace App\Services\Transcription;

use App\Contracts\SpeechToTextProvider;

class SimulatedSpeechProvider implements SpeechToTextProvider
{
    public function transcribe(string $audioPath, string $language): string
    {
        return $language === 'en'
            ? '[Demo] This is sample text. Your recording has not been transcribed. Edit this text before inserting it.'
            : '[Demostración] Este es un texto de ejemplo. Tu grabación no se ha transcrito. Edita este texto antes de insertarlo.';
    }
}
