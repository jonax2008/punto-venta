<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\CashRegister;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function index(CashRegister $cashRegister): AnonymousResourceCollection
    {
        return ExpenseResource::collection($cashRegister->expenses()->with('registeredBy')->get());
    }

    public function store(StoreExpenseRequest $request, CashRegister $cashRegister): JsonResponse
    {
        abort_unless($cashRegister->status === 'open', 422, 'Solo se pueden agregar egresos a una caja abierta.');

        $expense = $cashRegister->expenses()->create([
            ...$request->validated(),
            'registered_by' => $request->user()->id,
        ]);

        return response()->json(new ExpenseResource($expense->load('registeredBy')), 201);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        abort_unless($expense->cashRegister->status === 'open', 422, 'No se pueden eliminar egresos de una caja cerrada.');

        $expense->delete();

        return response()->json(['message' => 'Egreso eliminado.']);
    }
}
