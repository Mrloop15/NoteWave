<?php

namespace App\Providers;

use App\Models\Entry;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::bind('entry', fn (string $id) => Entry::where('user_id', request()->user()?->id)->whereKey($id)->firstOrFail());
        RateLimiter::for('entries', fn (Request $request) => Limit::perMinute(120)->by((string) $request->user()?->id));
    }
}
