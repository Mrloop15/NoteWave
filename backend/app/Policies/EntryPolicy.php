<?php

namespace App\Policies;

use App\Models\Entry;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EntryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function view(User $user, Entry $entry): Response
    {
        return $user->id === $entry->user_id ? Response::allow() : Response::denyAsNotFound();
    }

    public function update(User $user, Entry $entry): Response
    {
        return $this->view($user, $entry);
    }

    public function delete(User $user, Entry $entry): Response
    {
        return $this->view($user, $entry);
    }
}
