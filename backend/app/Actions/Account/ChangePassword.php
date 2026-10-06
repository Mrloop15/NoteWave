<?php

namespace App\Actions\Account;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ChangePassword
{
    public function execute(User $user, string $currentPassword, string $newPassword, string $sessionId): User
    {
        return DB::transaction(function () use ($user, $currentPassword, $newPassword, $sessionId) {
            $current = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            if (! Hash::check($currentPassword, $current->password)) {
                throw ValidationException::withMessages(['current_password' => 'La contraseña actual no es correcta.']);
            }
            $current->forceFill(['password' => $newPassword, 'remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $current->id)->where('id', '!=', $sessionId)->delete();
            DB::table('password_reset_tokens')->where('email', $current->email)->delete();

            return $current;
        }, 3);
    }
}
