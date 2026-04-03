<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'cash_register_id' => $this->cash_register_id,
            'description'      => $this->description,
            'amount'           => (float) $this->amount,
            'registered_by'    => new UserResource($this->whenLoaded('registeredBy')),
            'created_at'       => $this->created_at->toISOString(),
        ];
    }
}
