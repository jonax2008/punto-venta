<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderTrackerController extends Controller
{
    public function __invoke(Order $order): StreamedResponse
    {
        return response()->stream(function () use ($order) {
            $deadline = now()->addMinutes(10);

            while (now()->lessThan($deadline)) {
                $order->refresh();

                echo 'data: ' . json_encode([
                    'status'       => $order->status,
                    'order_number' => $order->order_number,
                    'confirmed_at' => $order->confirmed_at?->toISOString(),
                    'cancelled_at' => $order->cancelled_at?->toISOString(),
                ]) . "\n\n";

                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();

                if ($order->status !== 'pending') {
                    break;
                }

                sleep(3);
            }

            echo "event: close\ndata: {}\n\n";
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }
}
