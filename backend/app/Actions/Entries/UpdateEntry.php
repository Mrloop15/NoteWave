<?php

namespace App\Actions\Entries;

use App\Models\Entry;
use App\Models\User;

class UpdateEntry
{
    public function __construct(private WithEntryVersion $versions) {}

    public function execute(User $user, Entry $entry, array $data): Entry
    {
        return $this->versions->execute($user, $entry, (int) $data['version'], function (Entry $current) use ($data) {
            if (array_key_exists('title', $data)) {
                $current->title = $data['title'];
            }
            if (array_key_exists('description', $data)) {
                $current->description = $data['description'] ?? '';
            }
        });
    }
}
