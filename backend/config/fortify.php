<?php

use Laravel\Fortify\Features;

return [
    'guard' => 'web',
    'passwords' => 'users',
    'username' => 'email',
    'email' => 'email',
    'views' => false,
    'home' => '/app',
    'prefix' => '',
    'domain' => null,
    'lowercase_usernames' => true,
    'middleware' => ['web', 'throttle:identity'],
    'auth_middleware' => 'auth',
    'limiters' => ['login' => 'login', 'verification' => 'verification'],
    'features' => [Features::registration(), Features::resetPasswords(), Features::emailVerification()],
];
