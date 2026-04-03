<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\CashRegisterController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderTrackerController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ─── Públicas ─────────────────────────────────────────────────────────────────
Route::post('/auth/login', LoginController::class);
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/orders/{order}/track', OrderTrackerController::class);

// ─── Autenticadas ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', LogoutController::class);
    Route::get('/me', fn(Request $r) => new \App\Http\Resources\UserResource($r->user()->load('group')));

    // Admin + Encargado de grupo
    Route::middleware('role:admin,group_manager')->group(function () {
        Route::apiResource('products', ProductController::class);
        Route::apiResource('users', UserController::class);
    });

    // Solo Admin
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('groups', GroupController::class);
    });

    // Admin + Encargado + Cajero (operaciones del día)
    Route::middleware('role:admin,group_manager,cashier')->group(function () {
        // Crear pedidos requiere caja activa
        Route::post('/orders', [OrderController::class, 'store'])->middleware('active.cash-register');
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::delete('/orders/{order}', [OrderController::class, 'destroy']);
        Route::patch('/orders/{order}/confirm', [OrderController::class, 'confirm']);
        Route::patch('/orders/{order}/cancel', [OrderController::class, 'cancel']);

        Route::post('/cash-registers/open', [CashRegisterController::class, 'open']);
        Route::patch('/cash-registers/{cashRegister}/close', [CashRegisterController::class, 'close']);
        Route::get('/cash-registers/current', [CashRegisterController::class, 'current']);
        Route::get('/cash-registers', [CashRegisterController::class, 'index']);
        Route::get('/cash-registers/{cashRegister}', [CashRegisterController::class, 'show']);
        Route::apiResource('cash-registers.expenses', ExpenseController::class)->shallow();
    });

    // Reportes (Admin + Encargado)
    Route::middleware('role:admin,group_manager')->group(function () {
        Route::get('/reports/sales-by-group', [ReportController::class, 'salesByGroup']);
        Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
        Route::get('/reports/cash-registers', [ReportController::class, 'cashRegisterHistory']);
    });

    // Solo clientes
    Route::middleware('role:client')->group(function () {
        Route::get('/client/products', [ProductController::class, 'indexForClient']);
        Route::post('/client/orders', [OrderController::class, 'storeForClient']);
        Route::get('/client/orders', [OrderController::class, 'indexForClient']);
        Route::get('/client/orders/{order}', [OrderController::class, 'showForClient']);
    });
});

// OAuth callback — debe manejar redirect, no es JSON
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);
