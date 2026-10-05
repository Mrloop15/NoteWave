<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('kind', ['note', 'task']);
            $table->string('title', 200);
            $table->longText('description');
            $table->timestamp('completed_at', 6)->nullable();
            $table->unsignedBigInteger('version')->default(1);
            $table->timestamps(6);
            $table->index(['user_id', 'updated_at', 'id']);
            $table->index(['user_id', 'kind', 'completed_at', 'id']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE entries ADD CONSTRAINT entries_note_not_completed CHECK (kind = 'task' OR completed_at IS NULL)");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('entries');
    }
};
