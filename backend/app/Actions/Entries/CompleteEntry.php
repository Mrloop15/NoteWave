<?php

namespace App\Actions\Entries;

use App\Models\Entry;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CompleteEntry
{
    public function __construct(private WithEntryVersion $versions) {}

    public function execute(User $user, Entry $entry, int $version, bool $completed): Entry
    {
        return $this->versions->execute($user, $entry, $version, function (Entry $current) use ($completed) {
            if ($current->kind !== 'task') {
                throw ValidationException::withMessages(['completed' => 'Sólo las actividades pueden completarse.']);
            }
            if (($current->completed_at !== null) !== $completed) {
                $current->completed_at = $completed ? now() : null;
            }
        });
    }
}
