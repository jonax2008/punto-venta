<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'group_id',
        'google_id',
        'avatar_url',
        'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isGroupManager(): bool
    {
        return $this->role === 'group_manager';
    }

    public function isCashier(): bool
    {
        return $this->role === 'cashier';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    public function canManageProducts(): bool
    {
        return in_array($this->role, ['admin', 'group_manager']);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function clientProfile(): HasOne
    {
        return $this->hasOne(ClientProfile::class);
    }

    public function ordersAsCashier(): HasMany
    {
        return $this->hasMany(Order::class, 'cashier_id');
    }

    public function ordersAsClient(): HasMany
    {
        return $this->hasMany(Order::class, 'client_id');
    }
}
