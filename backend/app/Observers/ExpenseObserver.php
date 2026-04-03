<?php

namespace App\Observers;

use App\Models\CashRegister;
use App\Models\Expense;

class ExpenseObserver
{
    public function created(Expense $expense): void
    {
        CashRegister::where('id', $expense->cash_register_id)
            ->increment('total_expenses', $expense->amount);
    }

    public function deleted(Expense $expense): void
    {
        CashRegister::where('id', $expense->cash_register_id)
            ->decrement('total_expenses', $expense->amount);
    }
}
