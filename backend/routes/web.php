<?php

use Illuminate\Support\Facades\Route;

// Health check
Route::get('/up', fn() => response()->json(['status' => 'ok']));
