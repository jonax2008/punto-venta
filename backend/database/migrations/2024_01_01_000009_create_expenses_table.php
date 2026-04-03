<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_register_id')->constrained('cash_registers')->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->foreignId('registered_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('cash_register_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
