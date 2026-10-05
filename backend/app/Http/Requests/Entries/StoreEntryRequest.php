<?php

namespace App\Http\Requests\Entries;

use App\Models\Entry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Entry::class);
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(['note', 'task'])],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:20000'],
            'user_id' => ['prohibited'], 'id' => ['prohibited'],
            'completed_at' => ['prohibited'], 'completed' => ['prohibited'], 'version' => ['prohibited'],
        ];
    }
}
