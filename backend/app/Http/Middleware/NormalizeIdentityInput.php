<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NormalizeIdentityInput
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->is('login', 'register', 'forgot-password', 'reset-password')) {
            if ($request->has('email') && ! is_string($request->input('email'))) {
                abort(422, 'El correo no es válido.');
            }
            if (is_string($request->input('email'))) {
                $request->merge(['email' => Str::lower(trim($request->input('email')))]);
            }
        }

        return $next($request);
    }
}
