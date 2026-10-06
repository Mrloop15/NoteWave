<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    private function profile(array $overrides = []): array
    {
        return array_merge(['name' => 'Ana actualizada', 'dictation_language' => 'en', 'timezone' => 'America/Mexico_City', 'profile_version' => 1], $overrides);
    }

    private function password(array $overrides = []): array
    {
        return array_merge(['current_password' => 'Frase anterior privada 123', 'password' => 'Nueva frase privada 456', 'password_confirmation' => 'Nueva frase privada 456'], $overrides);
    }

    public function test_account_requires_verified_session(): void
    {
        $this->getJson('/api/v1/account/options')->assertUnauthorized();
        $this->patchJson('/api/v1/account/profile', $this->profile())->assertUnauthorized();
        $this->putJson('/api/v1/account/password', $this->password())->assertUnauthorized();
        $this->actingAs(User::factory()->unverified()->create());
        $this->getJson('/api/v1/account/options')->assertForbidden();
        $this->patchJson('/api/v1/account/profile', $this->profile())->assertForbidden();
        $this->putJson('/api/v1/account/password', $this->password())->assertForbidden();
    }

    public function test_profile_updates_only_owner_and_rejects_stale_versions(): void
    {
        [$user, $other] = User::factory()->count(2)->create()->all();
        $this->actingAs($user)->patchJson('/api/v1/account/profile', $this->profile())->assertOk()->assertJsonPath('data.profile_version', 2)->assertJsonPath('data.dictation_language', 'en')->assertJsonMissingPath('data.password');
        $this->assertSame('es', $other->fresh()->dictation_language);
        $this->patchJson('/api/v1/account/profile', $this->profile(['name' => 'Stale']))->assertConflict();
        $this->patchJson('/api/v1/account/profile', $this->profile(['profile_version' => 2]))->assertOk()->assertJsonPath('data.profile_version', 2);
        $this->patchJson('/api/v1/account/profile', $this->profile(['profile_version' => 2, 'timezone' => null]))->assertOk()->assertJsonPath('data.timezone', null)->assertJsonPath('data.profile_version', 3);
        $this->assertFalse($other->can('updateProfile', $user));
    }

    public function test_profile_validates_preferences_and_prohibits_identity_changes(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->patchJson('/api/v1/account/profile', $this->profile(['name' => '', 'dictation_language' => 'xx', 'timezone' => 'Invalid/Place', 'email' => 'changed@example.test', 'user_id' => 99, 'profile_version' => 0]))->assertUnprocessable()->assertJsonValidationErrors(['name', 'dictation_language', 'timezone', 'email', 'user_id', 'profile_version']);
        $this->getJson('/api/v1/account/options')->assertOk()->assertJsonFragment(['America/Mexico_City'])->assertHeader('Cache-Control', 'no-store, private');
        $this->getJson('/api/v1/me')->assertJsonPath('data.dictation_language', 'es')->assertJsonPath('data.timezone', null)->assertJsonPath('data.profile_version', 1);
    }

    public function test_password_requires_current_value_and_strong_matching_new_password(): void
    {
        $user = User::factory()->create(['password' => 'Frase anterior privada 123']);
        config(['sanctum.stateful' => ['localhost']]);
        $this->withHeaders(['Origin' => 'http://localhost'])->actingAs($user);
        $this->putJson('/api/v1/account/password', $this->password(['current_password' => 'wrong']))->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->putJson('/api/v1/account/password', $this->password(['password' => 'short']))->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->putJson('/api/v1/account/password', $this->password(['password' => str_repeat('é', 40), 'password_confirmation' => str_repeat('é', 40)]))->assertUnprocessable();
        $this->assertTrue(Hash::check('Frase anterior privada 123', $user->fresh()->password));
    }

    public function test_password_revokes_other_sessions_and_reset_tokens_without_touching_other_users(): void
    {
        $user = User::factory()->create(['password' => 'Frase anterior privada 123']);
        $other = User::factory()->create();
        DB::table('sessions')->insert([
            ['id' => 'previous-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()],
            ['id' => 'foreign-session', 'user_id' => $other->id, 'payload' => '', 'last_activity' => time()],
        ]);
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => 'test', 'created_at' => now()]);
        config(['sanctum.stateful' => ['localhost']]);
        $this->withHeaders(['Origin' => 'http://localhost'])->actingAs($user)->putJson('/api/v1/account/password', $this->password())->assertNoContent();
        $this->assertTrue(Hash::check('Nueva frase privada 456', $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => 'previous-session']);
        $this->assertDatabaseHas('sessions', ['id' => 'foreign-session']);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.id', $user->id);
    }

    public function test_password_endpoint_limits_attempts(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->putJson('/api/v1/account/password', [])->assertUnprocessable();
        }
        $this->putJson('/api/v1/account/password', [])->assertStatus(429);
    }
}
