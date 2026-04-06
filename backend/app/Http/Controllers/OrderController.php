<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $user   = $request->user();
        $status = $request->query('status');

        $orders = Order::with(['group', 'cashier', 'client', 'items'])
            ->when(! $user->isAdmin(), fn($q) => $q->where('group_id', $user->group_id))
            ->when($status, fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20);

        return OrderResource::collection($orders);
    }

    public function indexForClient(Request $request): AnonymousResourceCollection
    {
        $orders = Order::with(['items'])
            ->where('client_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->createOrder($request->user(), $request->validated());

        return response()->json(new OrderResource($order->load('items', 'cashier', 'group')), 201);
    }

    public function storeForClient(StoreOrderRequest $request): JsonResponse
    {
        $user = $request->user();

        // Para clientes, necesitan un grupo activo — tomaremos el primer grupo con caja abierta
        $openRegister = \App\Models\CashRegister::where('status', 'open')->first();

        if (! $openRegister) {
            return response()->json(['message' => 'No hay ventas activas en este momento.'], 422);
        }

        // Simular como si el cliente tuviera el grupo del corte activo
        $user->group_id = $openRegister->group_id;

        $order = $this->orderService->createOrder($user, array_merge($request->validated(), [
            'client_id' => $user->id,
        ]));

        return response()->json(new OrderResource($order->load('items')), 201);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        return new OrderResource($order->load(['group', 'cashier', 'client', 'items']));
    }

    public function showForClient(Request $request, Order $order): OrderResource
    {
        abort_unless($order->client_id === $request->user()->id, 403);

        return new OrderResource($order->load(['items']));
    }

    public function confirm(Request $request, Order $order): OrderResource
    {
        $request->validate([
            'amount_received' => ['nullable', 'numeric', 'min:0'],
        ]);

        $confirmed = $this->orderService->confirmOrder(
            $order,
            $request->user(),
            $request->amount_received !== null ? (float) $request->amount_received : null,
        );

        return new OrderResource($confirmed->load(['group', 'cashier', 'client', 'items']));
    }

    public function prepare(Request $request, Order $order): OrderResource
    {
        $prepared = $this->orderService->markPreparing($order, $request->user());

        return new OrderResource($prepared->load(['group', 'cashier', 'client', 'items']));
    }

    public function ready(Request $request, Order $order): OrderResource
    {
        $ready = $this->orderService->markReady($order, $request->user());

        return new OrderResource($ready->load(['group', 'cashier', 'client', 'items']));
    }

    public function cancel(Request $request, Order $order): OrderResource
    {
        $request->validate([
            'reason' => ['nullable', 'string'],
        ]);

        $cancelled = $this->orderService->cancelOrder($order, $request->user(), $request->reason);

        return new OrderResource($cancelled->load(['group', 'cashier', 'client', 'items']));
    }

    public function destroy(Order $order): JsonResponse
    {
        abort_unless($order->isPending(), 422, 'Solo se pueden eliminar pedidos pendientes.');

        $order->delete();

        return response()->json(['message' => 'Pedido eliminado.']);
    }
}
