<?php

namespace App\Contracts;

interface SpeechToTextProvider
{
    public function transcribe(string $audioPath, string $language): string;
}
