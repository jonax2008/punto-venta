<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_group_frequencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->unsignedBigInteger('frequency')->default(0);
            $table->timestamp('last_sold_at')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'group_id']);
            $table->index(['group_id', 'frequency']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_group_frequencies');
    }
};
