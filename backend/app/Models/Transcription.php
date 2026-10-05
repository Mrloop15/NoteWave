<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Transcription extends Model
{
    use HasUlids;

    protected $guarded = ['id'];

    protected $hidden = ['audio_path', 'audio_hash', 'user_id', 'idempotency_key'];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'duration_seconds' => 'integer'];
    }
}
