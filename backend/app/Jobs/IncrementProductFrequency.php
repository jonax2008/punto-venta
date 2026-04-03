<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class IncrementProductFrequency implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $productId,
        public readonly int $groupId,
    ) {}

    public function handle(): void
    {
        DB::table('product_group_frequencies')->upsert(
            [
                'product_id'   => $this->productId,
                'group_id'     => $this->groupId,
                'frequency'    => 1,
                'last_sold_at' => now(),
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            uniqueBy: ['product_id', 'group_id'],
            update: [
                'frequency'    => DB::raw('frequency + 1'),
                'last_sold_at' => now(),
                'updated_at'   => now(),
            ]
        );
    }
}
