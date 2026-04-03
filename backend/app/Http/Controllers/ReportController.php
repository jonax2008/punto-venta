<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Group;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesByGroup(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date'],
        ]);

        $from = $request->query('from', now()->startOfMonth()->toDateString());
        $to   = $request->query('to', now()->toDateString());

        $data = Group::withCount([
            'orders as total_orders' => fn($q) => $q
                ->where('status', 'confirmed')
                ->whereBetween('confirmed_at', [$from . ' 00:00:00', $to . ' 23:59:59']),
        ])
        ->withSum([
            'orders as total_sales' => fn($q) => $q
                ->where('status', 'confirmed')
                ->whereBetween('confirmed_at', [$from . ' 00:00:00', $to . ' 23:59:59']),
        ], 'total')
        ->get()
        ->map(fn($g) => [
            'group_id'     => $g->id,
            'group_name'   => $g->name,
            'total_orders' => (int) $g->total_orders,
            'total_sales'  => (float) ($g->total_sales ?? 0),
        ]);

        return response()->json([
            'from' => $from,
            'to'   => $to,
            'data' => $data,
        ]);
    }

    public function topProducts(Request $request): JsonResponse
    {
        $request->validate([
            'from'     => ['nullable', 'date'],
            'to'       => ['nullable', 'date'],
            'group_id' => ['nullable', 'exists:groups,id'],
            'limit'    => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $from    = $request->query('from', now()->startOfMonth()->toDateString());
        $to      = $request->query('to', now()->toDateString());
        $groupId = $request->query('group_id');
        $limit   = $request->query('limit', 10);

        $data = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'confirmed')
            ->whereBetween('orders.confirmed_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->when($groupId, fn($q) => $q->where('orders.group_id', $groupId))
            ->select(
                'order_items.product_id',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.subtotal) as total_revenue')
            )
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();

        return response()->json([
            'from'     => $from,
            'to'       => $to,
            'group_id' => $groupId,
            'data'     => $data,
        ]);
    }

    public function cashRegisterHistory(Request $request): JsonResponse
    {
        $request->validate([
            'from'     => ['nullable', 'date'],
            'to'       => ['nullable', 'date'],
            'group_id' => ['nullable', 'exists:groups,id'],
        ]);

        $from    = $request->query('from', now()->startOfMonth()->toDateString());
        $to      = $request->query('to', now()->toDateString());
        $groupId = $request->query('group_id');
        $user    = $request->user();

        $registers = CashRegister::with(['group', 'openedBy', 'closedBy'])
            ->when(! $user->isAdmin(), fn($q) => $q->where('group_id', $user->group_id))
            ->when($groupId && $user->isAdmin(), fn($q) => $q->where('group_id', $groupId))
            ->whereBetween('opened_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->orderByDesc('opened_at')
            ->get()
            ->map(fn($r) => [
                'id'             => $r->id,
                'group'          => $r->group->name,
                'opened_at'      => $r->opened_at->toISOString(),
                'closed_at'      => $r->closed_at?->toISOString(),
                'opening_amount' => (float) $r->opening_amount,
                'total_sales'    => (float) $r->total_sales,
                'total_expenses' => (float) $r->total_expenses,
                'net_amount'     => $r->netAmount(),
                'status'         => $r->status,
                'auto_closed'    => $r->auto_closed,
                'opened_by'      => $r->openedBy->name,
                'closed_by'      => $r->closedBy?->name,
            ]);

        return response()->json([
            'from' => $from,
            'to'   => $to,
            'data' => $registers,
        ]);
    }
}
