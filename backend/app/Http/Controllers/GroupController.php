<?php

namespace App\Http\Controllers;

use App\Http\Resources\GroupResource;
use App\Models\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GroupController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return GroupResource::collection(Group::with('manager')->get());
    }

    public function show(Group $group): GroupResource
    {
        return new GroupResource($group->load('manager'));
    }

    public function update(Request $request, Group $group): GroupResource
    {
        $data = $request->validate([
            'is_active'  => ['boolean'],
            'manager_id' => ['nullable', 'exists:users,id'],
        ]);

        if (isset($data['manager_id'])) {
            // Quitar el rol group_manager anterior del grupo
            $group->users()
                ->where('role', 'group_manager')
                ->update(['role' => 'cashier']);

            // Asignar nuevo encargado
            \App\Models\User::where('id', $data['manager_id'])
                ->update(['role' => 'group_manager', 'group_id' => $group->id]);
        }

        $group->update(['is_active' => $data['is_active'] ?? $group->is_active]);

        return new GroupResource($group->fresh('manager'));
    }
}
