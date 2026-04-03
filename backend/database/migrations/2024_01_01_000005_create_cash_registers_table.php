<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->restrictOnDelete();
            $table->foreignId('opened_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->decimal('opening_amount', 10, 2)->default(0);
            $table->decimal('total_sales', 10, 2)->default(0);
            $table->decimal('total_expenses', 10, 2)->default(0);
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->boolean('auto_closed')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['group_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_registers');
    }
};
