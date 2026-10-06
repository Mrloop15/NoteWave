<?php

namespace App\Actions\Account;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UpdateProfile
{
    public function execute(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $current = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            abort_if($current->profile_version !== (int) $data['profile_version'], 409, 'Tu perfil cambió en otra pestaña. Revisa la versión guardada.');
            $current->forceFill(['name' => $data['name'], 'dictation_language' => $data['dictation_language'], 'timezone' => $data['timezone']]);
            if ($current->isDirty()) {
                $current->profile_version++;
                $current->save();
            }

            return $current;
        }, 3);
    }
}
