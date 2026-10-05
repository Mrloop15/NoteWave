<?php

$uploadBytes = ini_parse_quantity((string) ini_get('upload_max_filesize'));
$postBytes = ini_parse_quantity((string) ini_get('post_max_size'));

return [
    'enabled' => env('TRANSCRIPTION_ENABLED', env('APP_ENV') !== 'production'),
    'driver' => env('TRANSCRIPTION_DRIVER', 'simulated'),
    'ffmpeg' => env('FFMPEG_BINARY', PHP_OS_FAMILY === 'Windows' ? base_path('.local/ffmpeg/bin/ffmpeg.exe') : 'ffmpeg'),
    'max_seconds' => 120,
    'max_kilobytes' => min(10240, (int) floor(($uploadBytes > 0 ? $uploadBytes : PHP_INT_MAX) / 1024), (int) floor(($postBytes > 0 ? max(1024, $postBytes - 16384) : PHP_INT_MAX) / 1024)),
    'daily_seconds' => 1200,
    'retention_hours' => 24,
    'processing_seconds' => 300,
];
