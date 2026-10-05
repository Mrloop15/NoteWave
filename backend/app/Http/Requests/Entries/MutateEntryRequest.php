<?php

namespace App\Http\Requests\Entries;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class MutateEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        Gate::authorize($this->isMethod('DELETE') ? 'delete' : 'update', $this->route('entry'));

        return true;
    }

    public function rules(): array
    {
        return [
            'version' => ['required', 'integer', 'min:1'],
            'user_id' => ['prohibited'], 'id' => ['prohibited'],
            'kind' => ['prohibited'], 'completed_at' => ['prohibited'],
        ];
    }
}
