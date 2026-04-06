<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'order_number'        => $this->order_number,
            'group_id'            => $this->group_id,
            'group'               => new GroupResource($this->whenLoaded('group')),
            'cash_register_id'    => $this->cash_register_id,
            'client'              => new UserResource($this->whenLoaded('client')),
            'cashier'             => new UserResource($this->whenLoaded('cashier')),
            'client_name'         => $this->client_name,
            'status'              => $this->status,
            'subtotal'            => (float) $this->subtotal,
            'discount'            => (float) $this->discount,
            'total'               => (float) $this->total,
            'amount_received'     => $this->amount_received !== null ? (float) $this->amount_received : null,
            'notes'               => $this->notes,
            'confirmed_at'        => $this->confirmed_at?->toISOString(),
            'prepared_at'         => $this->prepared_at?->toISOString(),
            'ready_at'            => $this->ready_at?->toISOString(),
            'cancelled_at'        => $this->cancelled_at?->toISOString(),
            'cancellation_reason' => $this->cancellation_reason,
            'items'               => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at'          => $this->created_at->toISOString(),
        ];
    }
}
