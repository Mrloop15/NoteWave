<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('dictation_language', 5)->default('es');
            $table->string('timezone', 64)->nullable();
            $table->unsignedInteger('profile_version')->default(1);
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['dictation_language', 'timezone', 'profile_version']));
    }
};
