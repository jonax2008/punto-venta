<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::with('group')
            ->when(
                $request->user()->isGroupManager(),
                fn($q) => $q->where('group_id', $request->user()->group_id)
            )
            ->whereIn('role', ['group_manager', 'cashier'])
            ->get();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'group_id' => $request->group_id,
        ]);

        return response()->json(new UserResource($user->load('group')), 201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load('group'));
    }

    public function update(Request $request, User $user): UserResource
    {
        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'string', 'min:8'],
            'role'     => ['sometimes', 'in:group_manager,cashier'],
            'group_id' => ['sometimes', 'exists:groups,id'],
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update(array_filter($data, fn($v) => ! is_null($v)));

        return new UserResource($user->fresh('group'));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado.']);
    }
}
