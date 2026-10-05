<?php

// Run explicitly against the isolated E2E database, never the development database.
use App\Actions\Entries\WithEntryVersion;
use App\Models\Entry;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
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
    throw new RuntimeException('Requires the isolated notewave_e2e MySQL connection.');
}

if (($argv[1] ?? '') === 'worker') {
    $user = User::findOrFail($argv[2]);
    $entry = Entry::findOrFail($argv[3]);
    $barrier = $argv[4];
    file_put_contents($barrier.'.'.$argv[5], 'ready');
    $deadline = microtime(true) + 10;
    while (! is_file($barrier)) {
        if (microtime(true) > $deadline) {
            throw new RuntimeException('Barrier timeout.');
        }
        usleep(10000);
    }
    try {
        app(WithEntryVersion::class)->execute($user, $entry, 1, function (Entry $locked) use ($argv) {
            usleep(250000);
            $locked->title = 'Writer '.$argv[5];
        });
        echo '200';
    } catch (HttpException $error) {
        echo $error->getStatusCode();
    }
    exit;
}

$user = User::factory()->create();
$entry = new Entry(['kind' => 'note', 'title' => 'Concurrency probe', 'description' => '']);
$entry->user()->associate($user);
$entry->save();
$barrier = sys_get_temp_dir().'/notewave-'.bin2hex(random_bytes(10));
$workers = [];
try {
    foreach ([1, 2] as $index) {
        $process = proc_open([PHP_BINARY, __FILE__, 'worker', (string) $user->id, $entry->id, $barrier, (string) $index], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $root);
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
                throw new RuntimeException('Concurrent writer timed out.');
            }
            usleep(10000);
        }
        $statuses[] = (int) stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        if ($errors !== '') {
            throw new RuntimeException('Worker reported an error.');
        }
    }
    sort($statuses);
    if ($statuses !== [200, 409] || $entry->refresh()->version !== 2) {
        throw new RuntimeException('Concurrent writes did not preserve optimistic versioning.');
    }
    $rejected = false;
    try {
        DB::table('entries')->where('id', $entry->id)->update(['completed_at' => now()]);
    } catch (QueryException $error) {
        $rejected = str_contains($error->getMessage(), 'entries_note_not_completed');
    }
    if (! $rejected) {
        throw new RuntimeException('Database did not enforce the note completion constraint.');
    }
    echo "PASS: concurrent writers returned 200/409; version=2; note constraint enforced.\n";
} finally {
    foreach ($workers as [$process, $pipes]) {
        if (is_resource($process)) {
            proc_terminate($process);
            foreach ($pipes as $pipe) {
                if (is_resource($pipe)) {
                    fclose($pipe);
                }
            }
            proc_close($process);
        }
    }
    $user->delete();
    foreach ([$barrier, $barrier.'.1', $barrier.'.2'] as $file) {
        if (is_file($file)) {
            unlink($file);
        }
    }
}
