<?php

use App\Http\Controllers\Operations\HealthController;
use App\Http\Middleware\NormalizeIdentityInput;
use App\Http\Middleware\PrivateResponses;
use App\Http\Middleware\ValidateRelativeSignature;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        api: __DIR__.'/../routes/api.php',
        then: function () {
            Route::get('/health/live', HealthController::class);
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->append(PrivateResponses::class);
        $middleware->web(append: [NormalizeIdentityInput::class]);
        $middleware->redirectGuestsTo('/auth/login');
        $middleware->redirectUsersTo('/app');
        $middleware->alias(['signed' => ValidateRelativeSignature::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*', 'health/*') || $request->expectsJson()
        );
    })->create();
