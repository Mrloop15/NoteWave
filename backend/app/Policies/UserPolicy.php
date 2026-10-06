<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function updateProfile(User $actor, User $target): bool
    {
        return $actor->id === $target->id && $actor->hasVerifiedEmail();
    }

    public function changePassword(User $actor, User $target): bool
    {
        return $this->updateProfile($actor, $target);
    }
}
