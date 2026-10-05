<?php

namespace App\Actions\Identity;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordRules;

    public function reset($user, array $input): void
    {
        Validator::make($input, ['password' => $this->passwordRules()])->validate();

        DB::transaction(function () use ($user, $input) {
            $user->forceFill(['password' => $input['password'], 'remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $user->getKey())->delete();
        });
    }
}
