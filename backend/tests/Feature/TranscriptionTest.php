<?php

namespace Tests\Feature;

use App\Actions\Transcription\DiscardTranscription;
use App\Contracts\SpeechToTextProvider;
use App\Jobs\TranscribeAudio;
use App\Models\Transcription;
use App\Models\User;
use App\Services\Transcription\AudioInspector;
use App\Services\Transcription\SimulatedSpeechProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class TranscriptionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['transcription.enabled' => true]);
        Storage::fake('transcription');
        Queue::fake();
    }

    private function audio(bool $silent = false, float $seconds = 1): UploadedFile
    {
        $pcm = str_repeat(pack('v', $silent ? 0 : 4000), (int) (16000 * $seconds));
        $wav = 'RIFF'.pack('V', 36 + strlen($pcm)).'WAVEfmt '.pack('VvvVVvv', 16, 1, 1, 16000, 32000, 2, 16).'data'.pack('V', strlen($pcm)).$pcm;

        return UploadedFile::fake()->createWithContent('recording.wav', $wav);
    }

    private function upload(?string $key = null, ?UploadedFile $audio = null, string $language = 'es')
    {
        return $this->post('/api/v1/transcriptions', ['audio' => $audio ?? $this->audio(), 'language' => $language, 'idempotency_key' => $key ?? (string) Str::uuid()], ['Accept' => 'application/json']);
    }

    private function fakeInspection(): void
    {
        $this->mock(AudioInspector::class)->shouldReceive('inspect')->andReturn(['wav' => 'test audio', 'seconds' => 30]);
    }

    public function test_audio_is_private_owned_and_transcription_does_not_create_entries(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner);
        $response = $this->upload()->assertStatus(202)->assertJsonPath('data.simulated', true)->assertJsonMissingPath('data.audio_path')->assertJsonMissingPath('data.user_id');
        $record = Transcription::findOrFail($response->json('data.id'));
        $path = $record->audio_path;
        Storage::disk('transcription')->assertExists($path);
        $this->actingAs(User::factory()->create());
        $this->getJson('/api/v1/transcriptions/'.$record->id)->assertNotFound();
        $this->deleteJson('/api/v1/transcriptions/'.$record->id)->assertNotFound();
        (new TranscribeAudio($record->id))->handle(new SimulatedSpeechProvider);
        Storage::disk('transcription')->assertMissing($path);
        $this->actingAs($owner)->getJson('/api/v1/transcriptions/'.$record->id)->assertOk()->assertJsonPath('data.status', 'ready')->assertHeader('Cache-Control', 'no-store, private');
        $this->assertStringContainsString('[Demostración]', $record->refresh()->transcript);
        $this->assertDatabaseCount('entries', 0);
        $this->deleteJson('/api/v1/transcriptions/'.$record->id)->assertNoContent();
        $this->assertNull($record->refresh()->transcript);
    }

    public function test_requires_verified_session_and_rejects_internal_fields(): void
    {
        $this->getJson('/api/v1/transcriptions/options')->assertUnauthorized();
        $this->upload()->assertUnauthorized();
        $this->actingAs(User::factory()->unverified()->create())->getJson('/api/v1/transcriptions/options')->assertForbidden();
        $this->upload()->assertForbidden();
        $this->actingAs(User::factory()->create())->postJson('/api/v1/transcriptions', ['user_id' => 1, 'status' => 'ready', 'transcript' => 'forged', 'duration_seconds' => 1, 'audio_path' => 'secret'])->assertUnprocessable()->assertJsonValidationErrors(['user_id', 'status', 'transcript', 'duration_seconds', 'audio_path', 'audio']);
    }

    public function test_inspects_real_bytes_duration_and_silence(): void
    {
        $this->actingAs(User::factory()->create());
        $this->upload(audio: UploadedFile::fake()->createWithContent('audio.webm', '<html>not audio</html>'))->assertUnprocessable();
        $this->upload(audio: $this->audio(true))->assertUnprocessable()->assertJsonValidationErrors('audio');
        $this->upload(audio: $this->audio(seconds: 0.1))->assertUnprocessable();
        config(['transcription.max_seconds' => 1]);
        $this->upload(audio: $this->audio(seconds: 2))->assertUnprocessable();
        $this->assertDatabaseCount('transcriptions', 0);
        $this->assertSame([], Storage::disk('transcription')->allFiles());
    }

    public function test_idempotency_replays_once_and_rejects_different_payload(): void
    {
        $this->fakeInspection();
        $this->actingAs(User::factory()->create());
        $key = (string) Str::uuid();
        $first = $this->upload($key)->assertStatus(202)->json('data.id');
        $this->upload($key)->assertStatus(202)->assertJsonPath('data.id', $first);
        $this->upload($key, language: 'en')->assertConflict();
        $this->assertDatabaseCount('transcriptions', 1);
        $this->assertCount(1, Storage::disk('transcription')->allFiles());
        (new TranscribeAudio($first))->handle(new SimulatedSpeechProvider);
        $this->travel(25)->hours();
        $this->upload($key)->assertStatus(202)->assertJsonPath('data.status', 'expired')->assertJsonPath('data.transcript', null);
    }

    public function test_concurrency_and_daily_quota_do_not_reset_on_cancellation(): void
    {
        $this->fakeInspection();
        config(['transcription.daily_seconds' => 30]);
        $this->actingAs(User::factory()->create());
        $id = $this->upload()->assertStatus(202)->json('data.id');
        $this->upload()->assertStatus(429);
        $this->deleteJson('/api/v1/transcriptions/'.$id)->assertNoContent();
        $this->upload()->assertStatus(429);
        $this->travel(1)->days();
        $this->upload()->assertStatus(202);
    }

    public function test_cancel_during_provider_call_does_not_restore_result(): void
    {
        $this->fakeInspection();
        $this->actingAs(User::factory()->create());
        $id = $this->upload()->assertStatus(202)->json('data.id');
        $provider = $this->mock(SpeechToTextProvider::class);
        $provider->shouldReceive('transcribe')->once()->andReturnUsing(function () use ($id) {
            app(DiscardTranscription::class)->execute(Transcription::findOrFail($id));

            return 'Must never be retained';
        });
        (new TranscribeAudio($id))->handle($provider);
        $this->assertDatabaseHas('transcriptions', ['id' => $id, 'status' => 'cancelled', 'transcript' => null, 'audio_path' => null]);
        $this->assertSame([], Storage::disk('transcription')->allFiles());
    }

    public function test_provider_failure_is_normalized_and_audio_removed(): void
    {
        $this->fakeInspection();
        $this->actingAs(User::factory()->create());
        $id = $this->upload()->assertStatus(202)->json('data.id');
        $provider = $this->mock(SpeechToTextProvider::class);
        $provider->shouldReceive('transcribe')->andThrow(new \RuntimeException('Private provider response'));
        (new TranscribeAudio($id))->handle($provider);
        $this->getJson('/api/v1/transcriptions/'.$id)->assertJsonPath('data.error_code', 'provider_unavailable')->assertDontSee('Private provider response');
        $this->assertSame([], Storage::disk('transcription')->allFiles());
    }

    public function test_cleanup_expires_results_stalled_jobs_and_orphan_audio(): void
    {
        $this->fakeInspection();
        $this->actingAs(User::factory()->create());
        $id = $this->upload()->assertStatus(202)->json('data.id');
        $this->travel(6)->minutes();
        $this->artisan('transcriptions:cleanup')->assertSuccessful();
        $this->assertDatabaseHas('transcriptions', ['id' => $id, 'status' => 'failed', 'audio_path' => null]);
        $second = $this->upload()->assertStatus(202)->json('data.id');
        (new TranscribeAudio($second))->handle(new SimulatedSpeechProvider);
        Storage::disk('transcription')->put('orphan.wav', 'private');
        $this->travel(25)->hours();
        $this->artisan('transcriptions:cleanup')->assertSuccessful();
        $this->assertDatabaseHas('transcriptions', ['id' => $second, 'status' => 'expired', 'transcript' => null]);
        $this->assertSame([], Storage::disk('transcription')->allFiles());
    }

    public function test_disabled_dictation_leaves_entries_available(): void
    {
        config(['transcription.enabled' => false]);
        $this->actingAs(User::factory()->create());
        $this->getJson('/api/v1/transcriptions/options')->assertJsonPath('data.enabled', false);
        $this->upload()->assertStatus(503);
        $this->postJson('/api/v1/entries', ['kind' => 'note', 'title' => 'Manual'])->assertCreated();
    }

    public function test_cleanup_traverses_multiple_batches_without_revisiting_expired_rows(): void
    {
        $user = User::factory()->create();
        for ($index = 0; $index < 105; $index++) {
            Transcription::create([
                'user_id' => $user->id, 'idempotency_key' => (string) Str::uuid(),
                'audio_hash' => str_repeat('a', 64), 'language' => 'es', 'duration_seconds' => 1,
                'status' => 'ready', 'transcript' => 'Temporary fixture', 'expires_at' => now()->subMinute(),
            ]);
        }
        $this->artisan('transcriptions:cleanup')->assertSuccessful();
        $this->assertSame(105, Transcription::where('status', 'expired')->whereNull('transcript')->count());
    }
}
