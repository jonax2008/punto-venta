<?php

use App\Services\CashRegisterService;
use Illuminate\Support\Facades\Schedule;

// Cierre automático de cajas al final del día
Schedule::call(fn() => app(CashRegisterService::class)->autoCloseAll())
    ->dailyAt('23:59')
    ->name('auto-close-cash-registers')
    ->withoutOverlapping();
