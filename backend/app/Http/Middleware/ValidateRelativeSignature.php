<?php

namespace App\Http\Middleware;

use Illuminate\Routing\Middleware\ValidateSignature;

class ValidateRelativeSignature extends ValidateSignature
{
    protected function parseArguments(array $args)
    {
        return parent::parseArguments(['relative', ...$args]);
    }
}
