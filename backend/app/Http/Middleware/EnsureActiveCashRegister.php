<?php

namespace App\Http\Middleware;

use App\Models\CashRegister;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveCashRegister
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->group_id) {
            return response()->json(['message' => 'Usuario sin grupo asignado.'], 403);
        }

        $isOpen = CashRegister::where('group_id', $user->group_id)
            ->where('status', 'open')
            ->exists();

        if (! $isOpen) {
            return response()->json([
                'message' => 'No hay un corte de caja abierto para este grupo. Abre la caja antes de crear pedidos.',
            ], 422);
        }

        return $next($request);
    }
}
