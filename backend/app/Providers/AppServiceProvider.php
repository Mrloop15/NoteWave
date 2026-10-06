<?php

namespace App\Providers;

use App\Contracts\SpeechToTextProvider;
use App\Models\Entry;
use App\Models\Transcription;
use App\Services\Transcription\SimulatedSpeechProvider;
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
        $this->app->bind(SpeechToTextProvider::class, SimulatedSpeechProvider::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('account-password', fn (Request $request) => Limit::perMinute(5)->by((string) $request->user()?->id));
        Route::bind('transcription', fn (string $id) => Transcription::where('user_id', request()->user()?->id)->whereKey($id)->firstOrFail());
        RateLimiter::for('transcription-uploads', fn (Request $request) => Limit::perMinute(5)->by((string) $request->user()?->id));
        Route::bind('entry', fn (string $id) => Entry::where('user_id', request()->user()?->id)->whereKey($id)->firstOrFail());
        RateLimiter::for('entries', fn (Request $request) => Limit::perMinute(120)->by((string) $request->user()?->id));
    }
}
