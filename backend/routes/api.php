<?php

use App\Http\Controllers\Entries\EntryController;
use App\Http\Controllers\Identity\CurrentUserController;
use App\Http\Controllers\Operations\HealthController;
use App\Http\Controllers\Transcription\TranscriptionController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class);

Route::get('/v1/me', CurrentUserController::class)->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'verified', 'throttle:entries'])->prefix('v1')->group(function () {
    Route::apiResource('entries', EntryController::class);
    Route::patch('entries/{entry}/completion', [EntryController::class, 'completion']);
    Route::get('transcriptions/options', [TranscriptionController::class, 'options']);
    Route::post('transcriptions', [TranscriptionController::class, 'store'])->middleware('throttle:transcription-uploads');
    Route::get('transcriptions/{transcription}', [TranscriptionController::class, 'show']);
    Route::delete('transcriptions/{transcription}', [TranscriptionController::class, 'destroy']);
});
