<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TranscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'status' => $this->status, 'language' => $this->language,
            'transcript' => $this->status === 'ready' ? $this->transcript : null,
            'error_code' => $this->error_code, 'duration_seconds' => $this->duration_seconds,
            'expires_at' => $this->expires_at->toISOString(), 'simulated' => true,
        ];
    }
}
