<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Group extends Model
{
    protected $fillable = ['name', 'slug', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function manager(): HasOne
    {
        return $this->hasOne(User::class)->where('role', 'group_manager');
    }

    public function cashRegisters(): HasMany
    {
        return $this->hasMany(CashRegister::class);
    }

    public function openCashRegister(): HasOne
    {
        return $this->hasOne(CashRegister::class)->where('status', 'open');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function productFrequencies(): HasMany
    {
        return $this->hasMany(ProductGroupFrequency::class);
    }
}
