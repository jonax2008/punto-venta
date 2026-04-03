<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'price'       => (float) $this->price,
            'image_url'   => $this->image_url,
            'is_active'   => $this->is_active,
            'frequency'   => $this->when(isset($this->frequency), (int) $this->frequency),
            'created_by'  => new UserResource($this->whenLoaded('creator')),
        ];
    }
}
