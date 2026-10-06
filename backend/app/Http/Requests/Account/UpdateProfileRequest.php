<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateProfile', $this->user()) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'dictation_language' => ['required', 'in:es,en'],
            'timezone' => ['present', 'nullable', 'string', 'max:64', 'timezone:all'],
            'profile_version' => ['required', 'integer', 'min:1'],
            'id' => ['prohibited'], 'user_id' => ['prohibited'], 'email' => ['prohibited'],
            'email_verified_at' => ['prohibited'], 'password' => ['prohibited'],
        ];
    }
}
