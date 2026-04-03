<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashRegisterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'group_id'        => $this->group_id,
            'group'           => new GroupResource($this->whenLoaded('group')),
            'opened_by'       => new UserResource($this->whenLoaded('openedBy')),
            'closed_by'       => new UserResource($this->whenLoaded('closedBy')),
            'opened_at'       => $this->opened_at->toISOString(),
            'closed_at'       => $this->closed_at?->toISOString(),
            'opening_amount'  => (float) $this->opening_amount,
            'total_sales'     => (float) $this->total_sales,
            'total_expenses'  => (float) $this->total_expenses,
            'net_amount'      => $this->netAmount(),
            'status'          => $this->status,
            'auto_closed'     => $this->auto_closed,
            'notes'           => $this->notes,
            'expenses'        => ExpenseResource::collection($this->whenLoaded('expenses')),
        ];
    }
}
