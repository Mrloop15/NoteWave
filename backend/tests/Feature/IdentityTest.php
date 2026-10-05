<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPassword;
use App\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class IdentityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    public function test_registration_normalizes_email_and_does_not_accept_privileged_fields(): void
    {
        $this->postJson('/register', [
            'name' => 'Ana', 'email' => ' ANA@Example.com ',
            'password' => 'a sufficiently long password', 'password_confirmation' => 'a sufficiently long password',
            'email_verified_at' => now(), 'id' => 99,
        ])->assertCreated();
        $user = User::sole();
        $this->assertSame('ana@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
        $this->assertNotSame(99, $user->id);
        $this->assertTrue(Hash::check('a sufficiently long password', $user->password));
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.id', $user->id)->assertJsonMissingPath('data.password');
    }

    public function test_registration_rejects_weak_password_and_duplicate_email(): void
    {
        User::factory()->create(['email' => 'ana@example.com']);
        $this->postJson('/register', ['name' => 'Ana', 'email' => 'ANA@example.com', 'password' => 'short', 'password_confirmation' => 'other'])
            ->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->postJson('/register', ['email' => ['bad']])->assertUnprocessable();
    }

    public function test_login_and_logout_are_session_based(): void
    {
        $user = User::factory()->create(['password' => 'a sufficiently long password']);
        $this->postJson('/login', ['email' => $user->email, 'password' => 'incorrect'])->assertUnprocessable();
        $this->postJson('/login', ['email' => strtoupper($user->email), 'password' => 'a sufficiently long password'])->assertOk();
        $this->assertAuthenticatedAs($user);
        $this->postJson('/logout')->assertNoContent();
        $this->assertGuest();
    }

    public function test_me_requires_authentication_and_never_selects_another_user(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->withHeader('Authorization', 'Bearer 123|untrusted')->getJson('/api/v1/me')->assertUnauthorized();
        [$first, $second] = User::factory()->count(2)->create()->all();
        $this->actingAs($first)->getJson('/api/v1/me?user_id='.$second->id)->assertOk()
            ->assertJsonPath('data.id', $first->id)->assertJsonMissing(['email' => $second->email])
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_verification_requires_valid_unexpired_signature_and_matching_user(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->id, 'hash' => sha1($user->email)], absolute: false);
        $this->actingAs($other)->getJson($url)->assertForbidden();
        $this->actingAs($user)->getJson($url.'tampered')->assertForbidden();
        $expired = URL::temporarySignedRoute('verification.verify', now()->subMinute(), ['id' => $user->id, 'hash' => sha1($user->email)], absolute: false);
        $this->getJson($expired)->assertForbidden();
        $this->getJson($url)->assertNoContent();
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->getJson($url)->assertNoContent();
    }

    public function test_unverified_user_cannot_enter_verified_routes(): void
    {
        Route::middleware(['web', 'auth', 'verified'])->get('/verified-test', fn () => ['ok' => true]);
        $this->actingAs(User::factory()->unverified()->create())->getJson('/verified-test')->assertForbidden();
    }

    public function test_password_recovery_has_same_response_for_unknown_known_and_throttled_addresses(): void
    {
        $user = User::factory()->create();
        $known = $this->postJson('/forgot-password', ['email' => $user->email])->assertOk()->json();
        $unknown = $this->postJson('/forgot-password', ['email' => 'missing@example.com'])->assertOk()->json();
        $throttled = $this->postJson('/forgot-password', ['email' => $user->email])->assertOk()->json();
        $this->assertSame($known, $unknown);
        $this->assertSame($known, $throttled);
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_reset_is_single_use_and_revokes_existing_sessions(): void
    {
        $user = User::factory()->create();
        DB::table('sessions')->insert(['id' => 'old-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        $this->postJson('/forgot-password', ['email' => $user->email])->assertOk();
        $token = Notification::sent($user, ResetPassword::class)->sole()->token;
        $payload = ['email' => $user->email, 'token' => $token, 'password' => 'another very long password', 'password_confirmation' => 'another very long password'];
        $this->postJson('/reset-password', $payload)->assertOk();
        $this->assertTrue(Hash::check($payload['password'], $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => 'old-session']);
        $this->postJson('/reset-password', $payload)->assertUnprocessable();
    }

    public function test_reset_token_expires(): void
    {
        $user = User::factory()->create();
        $this->postJson('/forgot-password', ['email' => $user->email])->assertOk();
        $token = Notification::sent($user, ResetPassword::class)->sole()->token;
        $this->travel(61)->minutes();
        $this->postJson('/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'another very long password', 'password_confirmation' => 'another very long password'])->assertUnprocessable();
    }

    public function test_login_rate_limit_is_enforced(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', ['email' => 'missing@example.com', 'password' => 'incorrect'])->assertUnprocessable();
        }
        $this->postJson('/login', ['email' => 'missing@example.com', 'password' => 'incorrect'])->assertTooManyRequests();
    }
}
