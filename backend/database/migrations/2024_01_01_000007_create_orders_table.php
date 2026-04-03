<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 30)->unique();
            $table->foreignId('group_id')->constrained('groups')->restrictOnDelete();
            $table->foreignId('cash_register_id')->nullable()->constrained('cash_registers')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->text('notes')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();

            $table->index(['group_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('cash_register_id');
            $table->index('client_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
