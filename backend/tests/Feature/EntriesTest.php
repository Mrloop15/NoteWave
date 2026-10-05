<?php

namespace Tests\Feature;

use App\Actions\Entries\CreateEntry;
use App\Models\Entry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class EntriesTest extends TestCase
{
    use RefreshDatabase;

    private function entry(User $user, array $data = []): Entry
    {
        return app(CreateEntry::class)->execute($user, array_merge(['kind' => 'note', 'title' => 'Una idea', 'description' => 'Texto privado'], $data));
    }

    public function test_all_endpoints_require_a_verified_session(): void
    {
        $owner = User::factory()->create();
        $entry = $this->entry($owner);
        foreach ([['GET', '/entries'], ['POST', '/entries'], ['GET', '/entries/'.$entry->id], ['PATCH', '/entries/'.$entry->id], ['DELETE', '/entries/'.$entry->id], ['PATCH', '/entries/'.$entry->id.'/completion']] as [$method, $path]) {
            $this->json($method, '/api/v1'.$path)->assertUnauthorized();
        }
        $this->actingAs(User::factory()->unverified()->create());
        foreach (['GET', 'POST'] as $method) {
            $this->json($method, '/api/v1/entries')->assertForbidden();
        }
        foreach (['GET', 'PATCH', 'DELETE'] as $method) {
            $this->json($method, '/api/v1/entries/'.$entry->id)->assertForbidden();
        }
        $this->patchJson('/api/v1/entries/'.$entry->id.'/completion')->assertForbidden();
    }

    public function test_content_is_isolated_across_all_operations_and_search(): void
    {
        [$owner, $other] = User::factory()->count(2)->create()->all();
        $private = $this->entry($owner, ['title' => 'Secreto de Ana', 'kind' => 'task']);
        $mine = $this->entry($other, ['title' => 'Mi contenido']);
        $this->actingAs($other)->getJson('/api/v1/entries?user_id='.$owner->id)->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $mine->id)->assertJsonMissing(['title' => $private->title]);
        $this->getJson('/api/v1/entries?q=Secreto')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/entries/'.$private->id)->assertNotFound();
        $this->patchJson('/api/v1/entries/'.$private->id, ['title' => 'Robado', 'version' => 1])->assertNotFound();
        $this->patchJson('/api/v1/entries/'.$private->id.'/completion', ['completed' => true, 'version' => 1])->assertNotFound();
        $this->deleteJson('/api/v1/entries/'.$private->id, ['version' => 1])->assertNotFound();
        $this->assertSame(404, Gate::forUser($other)->inspect('update', $private)->status());
        $this->assertDatabaseHas('entries', ['id' => $private->id, 'title' => 'Secreto de Ana', 'version' => 1]);
    }

    public function test_create_detail_update_and_delete_preserve_text_and_versions(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/v1/entries', ['kind' => 'note', 'title' => '  Ideas  ', 'description' => "  texto\n<script>alert(1)</script>  "])
            ->assertCreated()->assertJsonPath('data.title', 'Ideas')->assertJsonPath('data.version', 1)->assertJsonPath('data.completed_at', null)->assertJsonMissingPath('data.user_id');
        $id = $response->json('data.id');
        $this->getJson('/api/v1/entries/'.$id)->assertOk()->assertJsonPath('data.description', "  texto\n<script>alert(1)</script>  ")->assertHeader('Cache-Control', 'no-store, private');
        $this->patchJson('/api/v1/entries/'.$id, ['version' => 1, 'title' => 'Editado', 'description' => null])->assertOk()->assertJsonPath('data.version', 2)->assertJsonPath('data.description', '');
        $this->deleteJson('/api/v1/entries/'.$id, ['version' => 2])->assertNoContent();
        $this->getJson('/api/v1/entries/'.$id)->assertNotFound();
        $this->assertDatabaseMissing('entries', ['id' => $id]);
    }

    public function test_stale_updates_deletes_and_completion_return_conflict(): void
    {
        $user = User::factory()->create();
        $entry = $this->entry($user, ['kind' => 'task']);
        $path = '/api/v1/entries/'.$entry->id;
        $this->actingAs($user)->patchJson($path, ['title' => 'Nueva versión', 'version' => 1])->assertOk();
        $this->patchJson($path, ['title' => 'No sobrescribir', 'version' => 1])->assertConflict();
        $this->deleteJson($path, ['version' => 1])->assertConflict();
        $this->patchJson($path.'/completion', ['completed' => true, 'version' => 1])->assertConflict();
        $this->assertDatabaseHas('entries', ['id' => $entry->id, 'title' => 'Nueva versión', 'version' => 2, 'completed_at' => null]);
    }

    public function test_completion_is_explicit_and_notes_cannot_be_completed(): void
    {
        $user = User::factory()->create();
        $task = $this->entry($user, ['kind' => 'task']);
        $note = $this->entry($user);
        $path = '/api/v1/entries/'.$task->id.'/completion';
        $first = $this->actingAs($user)->patchJson($path, ['completed' => true, 'version' => 1])->assertOk()->assertJsonPath('data.version', 2)->json('data');
        $this->patchJson($path, ['completed' => true, 'version' => 2])->assertOk()->assertJsonPath('data.version', 2)->assertJsonPath('data.completed_at', $first['completed_at']);
        $this->patchJson($path, ['completed' => false, 'version' => 2])->assertOk()->assertJsonPath('data.version', 3)->assertJsonPath('data.completed_at', null);
        $this->patchJson('/api/v1/entries/'.$note->id.'/completion', ['completed' => true, 'version' => 1])->assertUnprocessable();
        $this->assertNull($note->fresh()->completed_at);
    }

    public function test_validation_blocks_owner_type_and_internal_state_changes(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/v1/entries', ['kind' => 'invalid', 'title' => '', 'description' => str_repeat('a', 20001), 'user_id' => 500, 'completed_at' => now(), 'version' => 9])->assertUnprocessable()->assertJsonValidationErrors(['kind', 'title', 'description', 'user_id', 'completed_at', 'version']);
        $entry = $this->entry($user);
        $this->patchJson('/api/v1/entries/'.$entry->id, ['title' => 'Nuevo'])->assertUnprocessable()->assertJsonValidationErrors('version');
        $this->patchJson('/api/v1/entries/'.$entry->id, ['version' => 1, 'kind' => 'task', 'user_id' => 50])->assertUnprocessable()->assertJsonValidationErrors(['kind', 'user_id']);
        $this->getJson('/api/v1/entries?per_page=51&status=invalid&page=0')->assertUnprocessable();
        $this->postJson('/api/v1/entries', ['kind' => 'note', 'title' => str_repeat('x', 201)])->assertUnprocessable();
    }

    public function test_filters_search_and_stable_pagination(): void
    {
        $user = User::factory()->create();
        $note = $this->entry($user, ['title' => 'Plan 100%_listo!', 'description' => 'Buscar descripción']);
        $pending = $this->entry($user, ['kind' => 'task', 'title' => 'Comprar pan']);
        $done = $this->entry($user, ['kind' => 'task', 'title' => 'Comprar café']);
        $done->forceFill(['completed_at' => now()])->save();
        Entry::query()->update(['updated_at' => now()->startOfSecond()]);
        $this->actingAs($user)->getJson('/api/v1/entries?kind=note')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $note->id);
        $this->getJson('/api/v1/entries?status=pending')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $pending->id);
        $this->getJson('/api/v1/entries?status=completed')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $done->id);
        $this->getJson('/api/v1/entries?q='.urlencode('%_'))->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $note->id);
        $this->getJson('/api/v1/entries?q=descrip')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/entries?q=0')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $note->id);
        $first = $this->getJson('/api/v1/entries?per_page=2')->assertOk()->assertJsonPath('meta.total', 3)->json('data');
        $second = $this->getJson('/api/v1/entries?per_page=2&page=2')->assertJsonCount(1, 'data')->json('data');
        $ids = array_column(array_merge($first, $second), 'id');
        $this->assertCount(3, array_unique($ids));
        $sorted = $ids;
        rsort($sorted);
        $this->assertSame($sorted, $ids);
    }

    public function test_deleting_owner_cascades_entries(): void
    {
        $user = User::factory()->create();
        $entry = $this->entry($user);
        $user->delete();
        $this->assertDatabaseMissing('entries', ['id' => $entry->id]);
    }
}
