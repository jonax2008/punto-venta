<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CashRegisterService
{
    public function open(User $user, array $data): CashRegister
    {
        $alreadyOpen = CashRegister::where('group_id', $user->group_id)
            ->where('status', 'open')
            ->exists();

        if ($alreadyOpen) {
            throw ValidationException::withMessages([
                'group_id' => ['Ya existe un corte de caja abierto para este grupo.'],
            ]);
        }

        return CashRegister::create([
            'group_id'       => $user->group_id,
            'opened_by'      => $user->id,
            'opened_at'      => now(),
            'opening_amount' => $data['opening_amount'] ?? 0,
            'status'         => 'open',
            'notes'          => $data['notes'] ?? null,
        ]);
    }

    public function close(CashRegister $cashRegister, User $user, bool $autoClose = false): CashRegister
    {
        if ($cashRegister->status === 'closed') {
            throw ValidationException::withMessages([
                'status' => ['Este corte de caja ya está cerrado.'],
            ]);
        }

        $cashRegister->update([
            'status'     => 'closed',
            'closed_at'  => now(),
            'closed_by'  => $user->id,
            'auto_closed'=> $autoClose,
        ]);

        return $cashRegister->fresh(['group', 'openedBy', 'closedBy']);
    }

    public function autoCloseAll(): void
    {
        $openRegisters = CashRegister::where('status', 'open')->get();

        foreach ($openRegisters as $register) {
            $register->update([
                'status'     => 'closed',
                'closed_at'  => now(),
                'auto_closed'=> true,
            ]);
        }
    }
}
