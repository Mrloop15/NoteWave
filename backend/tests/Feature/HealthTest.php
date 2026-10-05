<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_liveness_is_public_and_does_not_require_a_database(): void
    {
        config(['database.default' => 'unavailable']);

        foreach (['/health/live', '/api/v1/health'] as $path) {
            $this->getJson($path)
                ->assertOk()
                ->assertExactJson(['status' => 'ok', 'service' => 'notewave'])
                ->assertHeader('Cache-Control', 'no-store, private');
        }
    }

    public function test_unknown_api_routes_return_json_not_the_spa(): void
    {
        $this->getJson('/api/v1/missing')->assertNotFound()->assertJsonStructure(['message']);
    }
}
