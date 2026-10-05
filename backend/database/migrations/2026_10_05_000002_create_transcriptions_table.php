<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transcriptions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('idempotency_key');
            $table->char('audio_hash', 64);
            $table->string('language', 5);
            $table->string('status', 16)->default('queued');
            $table->string('audio_path')->nullable();
            $table->text('transcript')->nullable();
            $table->string('error_code', 40)->nullable();
            $table->unsignedInteger('duration_seconds');
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['user_id', 'idempotency_key']);
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transcriptions');
    }
};
