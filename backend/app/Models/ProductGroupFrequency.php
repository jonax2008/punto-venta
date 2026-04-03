<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductGroupFrequency extends Model
{
    protected $fillable = ['product_id', 'group_id', 'frequency', 'last_sold_at'];

    protected function casts(): array
    {
        return ['last_sold_at' => 'datetime'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
}
