<?php

namespace App\Actions\Entries;

use App\Models\Entry;
use App\Models\User;

class CreateEntry
{
    public function execute(User $user, array $data): Entry
    {
        $entry = new Entry([
            'kind' => $data['kind'], 'title' => $data['title'], 'description' => $data['description'] ?? '',
        ]);
        $entry->user()->associate($user);
        $entry->save();

        return $entry->refresh();
    }
}
