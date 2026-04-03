<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $groupId = $request->query('group_id') ?? $request->user()?->group_id;

        $products = Product::query()
            ->where('is_active', true)
            ->when($groupId, function ($query) use ($groupId) {
                $query
                    ->leftJoin('product_group_frequencies as pgf', function ($join) use ($groupId) {
                        $join->on('pgf.product_id', '=', 'products.id')
                             ->where('pgf.group_id', '=', $groupId);
                    })
                    ->select('products.*', DB::raw('COALESCE(pgf.frequency, 0) as frequency'))
                    ->orderByDesc('frequency');
            }, function ($query) {
                $query->orderBy('name');
            })
            ->get();

        return ProductResource::collection($products);
    }

    public function indexForClient(Request $request): AnonymousResourceCollection
    {
        return $this->index($request);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return response()->json(new ProductResource($product), 201);
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load('creator'));
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product->fresh());
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->update(['is_active' => false]);

        return response()->json(['message' => 'Producto desactivado.']);
    }
}
