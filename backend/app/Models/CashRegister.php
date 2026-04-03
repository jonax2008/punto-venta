<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashRegister extends Model
{
    protected $fillable = [
        'group_id', 'opened_by', 'closed_by', 'opened_at', 'closed_at',
        'opening_amount', 'total_sales', 'total_expenses', 'status', 'auto_closed', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'opened_at'      => 'datetime',
            'closed_at'      => 'datetime',
            'opening_amount' => 'decimal:2',
            'total_sales'    => 'decimal:2',
            'total_expenses' => 'decimal:2',
            'auto_closed'    => 'boolean',
        ];
    }

    public function netAmount(): float
    {
        return (float) $this->total_sales - (float) $this->total_expenses;
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
