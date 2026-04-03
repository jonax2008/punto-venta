<?php

namespace App\Services;

use App\Jobs\IncrementProductFrequency;
use App\Models\CashRegister;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class OrderService
{
    public function createOrder(User $cashier, array $data): Order
    {
        return DB::transaction(function () use ($cashier, $data) {
            $items   = collect($data['items']);
            $discount = (float) ($data['discount'] ?? 0);

            // Calcular totales
            $subtotal = $items->sum(function ($item) {
                $product = Product::findOrFail($item['product_id']);
                return $product->price * $item['quantity'];
            });

            $total = max(0, $subtotal - $discount);

            // Obtener caja abierta del grupo
            $cashRegister = CashRegister::where('group_id', $cashier->group_id)
                ->where('status', 'open')
                ->first();

            $order = Order::create([
                'order_number'    => $this->generateOrderNumber(),
                'group_id'        => $cashier->group_id,
                'cash_register_id'=> $cashRegister?->id,
                'cashier_id'      => $cashier->id,
                'status'          => 'pending',
                'subtotal'        => $subtotal,
                'discount'        => $discount,
                'total'           => $total,
                'notes'           => $data['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                OrderItem::create([
                    'order_id'      => $order->id,
                    'product_id'    => $product->id,
                    'product_name'  => $product->name,
                    'product_price' => $product->price,
                    'quantity'      => $item['quantity'],
                    'unit_price'    => $product->price,
                    'subtotal'      => $product->price * $item['quantity'],
                    'notes'         => $item['notes'] ?? null,
                ]);
            }

            return $order->load('items');
        });
    }

    public function confirmOrder(Order $order, User $actor): Order
    {
        if (! $order->isPending()) {
            throw new InvalidArgumentException('Solo se pueden confirmar pedidos en estado pendiente.');
        }

        return DB::transaction(function () use ($order, $actor) {
            $order->update([
                'status'       => 'confirmed',
                'confirmed_at' => now(),
            ]);

            // Actualizar total de ventas en el corte de caja
            if ($order->cash_register_id) {
                CashRegister::where('id', $order->cash_register_id)
                    ->increment('total_sales', $order->total);
            }

            // Incrementar frecuencia de productos (asíncrono)
            foreach ($order->items as $item) {
                IncrementProductFrequency::dispatch($item->product_id, $order->group_id);
            }

            return $order->fresh();
        });
    }

    public function cancelOrder(Order $order, User $actor, ?string $reason = null): Order
    {
        if (! $order->isPending()) {
            throw new InvalidArgumentException('Solo se pueden cancelar pedidos en estado pendiente.');
        }

        $order->update([
            'status'               => 'cancelled',
            'cancelled_at'         => now(),
            'cancellation_reason'  => $reason,
        ]);

        return $order->fresh();
    }

    private function generateOrderNumber(): string
    {
        $date  = now()->format('Ymd');
        $count = Order::whereDate('created_at', today())->count() + 1;

        return 'ORD-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}
