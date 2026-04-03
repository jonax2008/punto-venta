<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->enum('role', ['admin', 'group_manager', 'cashier', 'client'])->default('cashier');
            $table->foreignId('group_id')->nullable()->constrained('groups')->nullOnDelete();
            $table->string('google_id')->nullable()->unique();
            $table->string('avatar_url', 500)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index('role');
            $table->index('group_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
