<?php

use App\Actions\Transcription\CreateTranscription;
use App\Actions\Transcription\DiscardTranscription;
use App\Models\Transcription;
use App\Models\User;
use App\Services\Transcription\AudioInspector;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

require __DIR__.'/../../vendor/autoload.php';
$root = dirname(__DIR__, 2);
if (! is_file($root.'/.env.e2e') || is_file($root.'/bootstrap/cache/config.php')) {
    throw new RuntimeException('Requires .env.e2e and uncached configuration.');
}
foreach (array_keys(getenv()) as $key) {
    if (str_starts_with($key, 'DB_') || $key === 'APP_ENV') {
        putenv($key);
        unset($_ENV[$key], $_SERVER[$key]);
    }
}
$app = require $root.'/bootstrap/app.php';
$app->loadEnvironmentFrom('.env.e2e');
$app->make(Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error) {
    fwrite(STDERR, 'FAIL: '.$error->getMessage().PHP_EOL);
    exit(1);
});
if (! $app->environment('e2e') || config('database.default') !== 'mysql' || config('database.connections.mysql.database') !== 'notewave_e2e' || config('database.connections.mysql.url')) {
    throw new RuntimeException('Requires isolated notewave_e2e database.');
}
config(['transcription.enabled' => true, 'transcription.daily_seconds' => 30]);
$originalQueue = app('queue');
Queue::fake();
$app->instance(AudioInspector::class, new class extends AudioInspector
{
    public function inspect(UploadedFile $audio): array
    {
        return ['wav' => 'synthetic concurrency fixture', 'seconds' => 30];
    }
});

if (($argv[1] ?? '') === 'worker') {
    $user = User::findOrFail($argv[2]);
    $barrier = $argv[3];
    file_put_contents($barrier.'.'.$argv[4], 'ready');
    $deadline = microtime(true) + 10;
    while (! is_file($barrier)) {
        if (microtime(true) > $deadline) {
            throw new RuntimeException('Barrier timed out.');
        }
        usleep(10000);
    }
    try {
        app(CreateTranscription::class)->execute($user, UploadedFile::fake()->createWithContent('fixture.wav', 'identical fixture'), 'es', $argv[5]);
        echo '202';
    } catch (HttpException $error) {
        echo $error->getStatusCode();
    }
    exit;
}

if (($argv[1] ?? '') !== 'worker') {
    Queue::swap($originalQueue);
    $queue = 'voice-probe-'.Str::ulid();
    config(['queue.default' => 'database', 'queue.connections.database.queue' => $queue]);
    $user = User::factory()->create();
    try {
        $record = app(CreateTranscription::class)->execute($user, UploadedFile::fake()->createWithContent('fixture.wav', 'fixture'), 'es', (string) Str::uuid());
        if ($record->status !== 'queued') {
            throw new RuntimeException('Expected a queued database job.');
        }
        Artisan::call('queue:work', ['connection' => 'database', '--queue' => $queue, '--once' => true, '--tries' => 1]);
        if ($record->refresh()->status !== 'ready' || $record->audio_path !== null) {
            throw new RuntimeException('Database worker did not finish and remove audio.');
        }
        echo 'PASS: database queue processed simulated audio and removed its file.'.PHP_EOL;
    } finally {
        foreach (Transcription::where('user_id', $user->id)->get() as $record) {
            app(DiscardTranscription::class)->execute($record);
        }
        $user->delete();
    }
}

foreach (['same-key', 'distinct-key'] as $scenario) {
    $user = User::factory()->create();
    $barrier = sys_get_temp_dir().'/notewave-voice-'.bin2hex(random_bytes(10));
    $workers = [];
    $key = (string) Str::uuid();
    try {
        foreach ([1, 2] as $index) {
            $workerKey = $scenario === 'same-key' ? $key : (string) Str::uuid();
            $process = proc_open([PHP_BINARY, __FILE__, 'worker', (string) $user->id, $barrier, (string) $index, $workerKey], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $root);
            if (! is_resource($process)) {
                throw new RuntimeException('Could not start worker.');
            }
            fclose($pipes[0]);
            $workers[] = [$process, $pipes];
        }
        $deadline = microtime(true) + 10;
        while (! is_file($barrier.'.1') || ! is_file($barrier.'.2')) {
            if (microtime(true) > $deadline) {
                throw new RuntimeException('Workers did not reach barrier.');
            }
            usleep(10000);
        }
        file_put_contents($barrier, 'go');
        $statuses = [];
        foreach ($workers as [$process, $pipes]) {
            $deadline = microtime(true) + 15;
            while (proc_get_status($process)['running']) {
                if (microtime(true) > $deadline) {
                    throw new RuntimeException('Worker timed out.');
                }
                usleep(10000);
            }
            $statuses[] = (int) stream_get_contents($pipes[1]);
            if (stream_get_contents($pipes[2]) !== '') {
                throw new RuntimeException('Worker reported an error.');
            }
        }
        sort($statuses);
        $expected = $scenario === 'same-key' ? [202, 202] : [202, 429];
        if ($statuses !== $expected || Transcription::where('user_id', $user->id)->count() !== 1 || (int) Transcription::where('user_id', $user->id)->sum('duration_seconds') !== 30) {
            throw new RuntimeException('Atomic upload failed: '.$scenario.' '.json_encode($statuses));
        }
        echo 'PASS: '.$scenario.'; one job and one quota reservation.'.PHP_EOL;
    } finally {
        foreach ($workers as [$process, $pipes]) {
            proc_terminate($process);
            foreach ($pipes as $pipe) {
                if (is_resource($pipe)) {
                    fclose($pipe);
                }
            }
            proc_close($process);
        }
        foreach (Transcription::where('user_id', $user->id)->get() as $record) {
            app(DiscardTranscription::class)->execute($record);
        }
        $user->delete();
        foreach ([$barrier, $barrier.'.1', $barrier.'.2'] as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
}
