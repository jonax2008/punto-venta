<?php

namespace App\Http\Controllers;

use App\Http\Requests\OpenCashRegisterRequest;
use App\Http\Resources\CashRegisterResource;
use App\Models\CashRegister;
use App\Services\CashRegisterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CashRegisterController extends Controller
{
    public function __construct(private CashRegisterService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $registers = CashRegister::with(['group', 'openedBy', 'closedBy'])
            ->when(
                ! $request->user()->isAdmin(),
                fn($q) => $q->where('group_id', $request->user()->group_id)
            )
            ->latest()
            ->paginate(15);

        return CashRegisterResource::collection($registers);
    }

    public function current(Request $request): JsonResponse
    {
        $register = CashRegister::with(['group', 'openedBy', 'expenses'])
            ->where('group_id', $request->user()->group_id)
            ->where('status', 'open')
            ->first();

        if (! $register) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => new CashRegisterResource($register)]);
    }

    public function show(CashRegister $cashRegister): CashRegisterResource
    {
        return new CashRegisterResource($cashRegister->load(['group', 'openedBy', 'closedBy', 'expenses']));
    }

    public function open(OpenCashRegisterRequest $request): JsonResponse
    {
        $register = $this->service->open($request->user(), $request->validated());

        return response()->json(new CashRegisterResource($register->load(['group', 'openedBy'])), 201);
    }

    public function close(Request $request, CashRegister $cashRegister): CashRegisterResource
    {
        $closed = $this->service->close($cashRegister, $request->user());

        return new CashRegisterResource($closed);
    }
}
