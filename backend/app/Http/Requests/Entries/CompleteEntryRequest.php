<?php

namespace App\Http\Requests\Entries;

class CompleteEntryRequest extends MutateEntryRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'completed' => ['required', 'boolean'],
            'title' => ['prohibited'], 'description' => ['prohibited'],
        ]);
    }
}
