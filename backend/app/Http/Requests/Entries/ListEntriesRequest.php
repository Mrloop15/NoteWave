<?php

namespace App\Http\Requests\Entries;

use App\Models\Entry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListEntriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Entry::class);
    }

    public function rules(): array
    {
        return [
            'kind' => ['sometimes', Rule::in(['note', 'task'])],
            'status' => ['sometimes', Rule::in(['pending', 'completed'])],
            'q' => ['nullable', 'string', 'max:200'],
            'page' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }
}
