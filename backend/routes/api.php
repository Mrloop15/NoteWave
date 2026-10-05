<?php

use App\Http\Controllers\Identity\CurrentUserController;
use App\Http\Controllers\Operations\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class);

Route::get('/v1/me', CurrentUserController::class)->middleware('auth:sanctum');
