<?php

namespace App\Actions\Identity;

use Closure;
use Illuminate\Validation\Rules\Password;

trait PasswordRules
{
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::min(12), 'confirmed', function (string $attribute, mixed $value, Closure $fail) {
            if (is_string($value) && strlen($value) > 72) {
                $fail('La contraseña es demasiado larga. Usa una frase más corta.');
            }
        }];
    }
}
