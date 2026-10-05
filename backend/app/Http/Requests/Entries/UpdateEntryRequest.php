<?php

namespace App\Http\Requests\Entries;

class UpdateEntryRequest extends MutateEntryRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'completed' => ['prohibited'],
        ]);
    }
}
