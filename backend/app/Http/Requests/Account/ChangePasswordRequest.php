<?php

namespace App\Http\Requests\Account;

use App\Actions\Identity\PasswordRules;
use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    use PasswordRules;

    public function authorize(): bool
    {
        return $this->user()?->can('changePassword', $this->user()) ?? false;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'max:72'],
            'password' => [...$this->passwordRules(), 'different:current_password'],
            'user_id' => ['prohibited'], 'id' => ['prohibited'], 'email' => ['prohibited'],
        ];
    }
}
