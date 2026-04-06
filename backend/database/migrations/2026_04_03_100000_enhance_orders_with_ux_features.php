<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('client_name', 100)->nullable()->after('client_id');
            $table->decimal('amount_received', 10, 2)->nullable()->after('total');
            $table->timestamp('prepared_at')->nullable()->after('confirmed_at');
            $table->timestamp('ready_at')->nullable()->after('prepared_at');
        });

        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending','confirmed','preparing','ready','cancelled') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending'");

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['client_name', 'amount_received', 'prepared_at', 'ready_at']);
        });
    }
};
