<?php

use App\Http\Controllers\Entries\EntryController;
use App\Http\Controllers\Identity\CurrentUserController;
use App\Http\Controllers\Operations\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class);

Route::get('/v1/me', CurrentUserController::class)->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'verified', 'throttle:entries'])->prefix('v1')->group(function () {
    Route::apiResource('entries', EntryController::class);
    Route::patch('entries/{entry}/completion', [EntryController::class, 'completion']);
});
