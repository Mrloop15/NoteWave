<?php

namespace App\Actions\Entries;

use App\Models\Entry;
use App\Models\User;

class DeleteEntry
{
    public function __construct(private WithEntryVersion $versions) {}

    public function execute(User $user, Entry $entry, int $version): void
    {
        $this->versions->execute($user, $entry, $version, fn (Entry $current) => $current->delete());
    }
}
