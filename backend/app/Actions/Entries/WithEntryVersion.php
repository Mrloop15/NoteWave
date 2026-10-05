<?php

namespace App\Actions\Entries;

use App\Models\Entry;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\DB;

class WithEntryVersion
{
    public function execute(User $user, Entry $entry, int $version, Closure $change): Entry
    {
        return DB::transaction(function () use ($user, $entry, $version, $change) {
            $current = Entry::where('user_id', $user->id)->whereKey($entry->id)->lockForUpdate()->firstOrFail();
            abort_if($current->version !== $version, 409, 'Otra sesión modificó este contenido. Tu borrador no se ha guardado.');
            $change($current);
            if ($current->exists && $current->isDirty()) {
                $current->version++;
                $current->save();
            }

            return $current;
        }, 3);
    }
}
