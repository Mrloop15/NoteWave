<?php

namespace App\Policies;

use App\Models\Transcription;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TranscriptionPolicy
{
    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function view(User $user, Transcription $transcription): Response
    {
        return $user->id === $transcription->user_id ? Response::allow() : Response::denyAsNotFound();
    }

    public function delete(User $user, Transcription $transcription): Response
    {
        return $this->view($user, $transcription);
    }
}
