import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Plus, Trash2, Lock, Unlock } from 'lucide-react'
import { cashRegisterApi } from '@/api/cashRegister'
import { useToast } from '@/components/shared/Toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export function CashRegisterPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [showClose, setShowClose] = useState(false)
  const [showOpenForm, setShowOpenForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)

  const { data: cashRegister, isLoading } = useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: () => cashRegisterApi.current(),
  })

  const { register: regOpen, handleSubmit: handleOpenSubmit } = useForm<{ opening_amount: number; notes: string }>()
  const { register: regExp, handleSubmit: handleExpSubmit, reset: resetExp } = useForm<{ description: string; amount: number }>()

  const openRegister = useMutation({
    mutationFn: cashRegisterApi.open,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      toast('Caja abierta')
      setShowOpenForm(false)
    },
    onError: () => toast('Error al abrir la caja', 'error'),
  })

  const closeRegister = useMutation({
    mutationFn: () => cashRegisterApi.close(cashRegister!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      toast('Caja cerrada')
      setShowClose(false)
    },
    onError: () => toast('Error al cerrar la caja', 'error'),
  })

  const addExpense = useMutation({
    mutationFn: (data: { description: string; amount: number }) =>
      cashRegisterApi.addExpense(cashRegister!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      toast('Egreso registrado')
      resetExp()
      setShowExpenseForm(false)
    },
    onError: () => toast('Error al registrar egreso', 'error'),
  })

  const deleteExpense = useMutation({
    mutationFn: cashRegisterApi.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      toast('Egreso eliminado')
    },
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', cashRegister?.id],
    queryFn: () => cashRegisterApi.listExpenses(cashRegister!.id),
    enabled: !! cashRegister,
  })

  if (isLoading) return <PageLoader />

  if (! cashRegister) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Corte de Caja</h1>
        <div className="card p-8 text-center space-y-4">
          <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
          <div>
            <h2 className="font-semibold text-gray-900">No hay caja abierta</h2>
            <p className="text-sm text-gray-500">Abre la caja para comenzar a registrar ventas</p>
          </div>
          {! showOpenForm ? (
            <button onClick={() => setShowOpenForm(true)} className="btn-primary mx-auto">
              <Unlock className="h-4 w-4" />
              Abrir caja
            </button>
          ) : (
            <form onSubmit={handleOpenSubmit((d) => openRegister.mutate(d))} className="space-y-3 text-left max-w-sm mx-auto">
              <div>
                <label className="label">Fondo inicial (opcional)</label>
                <input type="number" min={0} step="0.01" {...regOpen('opening_amount')} className="input" placeholder="0.00" />
              </div>
              <div>
                <label className="label">Notas (opcional)</label>
                <input type="text" {...regOpen('notes')} className="input" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowOpenForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={openRegister.isPending}>Abrir</button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Corte de Caja</h1>
        <button onClick={() => setShowClose(true)} className="btn-danger">
          <Lock className="h-4 w-4" />
          Cerrar caja
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Ventas totales', value: cashRegister.total_sales, color: 'text-emerald-600' },
          { label: 'Egresos',        value: cashRegister.total_expenses, color: 'text-red-500' },
          { label: 'Monto neto',     value: cashRegister.net_amount, color: 'text-primary' },
          { label: 'Fondo inicial',  value: cashRegister.opening_amount, color: 'text-gray-700' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="text-sm text-gray-500">
          Abierta: <span className="font-medium text-gray-900">{formatDate(cashRegister.opened_at)}</span>
          {cashRegister.opened_by && <> · por <span className="font-medium">{cashRegister.opened_by.name}</span></>}
        </p>
      </div>

      {/* Egresos */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Egresos</h2>
          <button onClick={() => setShowExpenseForm(! showExpenseForm)} className="btn-secondary py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Agregar egreso
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleExpSubmit((d) => addExpense.mutate(d))} className="flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-36">
              <label className="label">Descripción</label>
              <input {...regExp('description', { required: true })} className="input" placeholder="Ej: Hielo, servilletas..." />
            </div>
            <div className="w-32">
              <label className="label">Monto</label>
              <input type="number" min={0.01} step="0.01" {...regExp('amount', { required: true, min: 0.01 })} className="input" placeholder="0.00" />
            </div>
            <button type="submit" className="btn-primary" disabled={addExpense.isPending}>Guardar</button>
            <button type="button" onClick={() => setShowExpenseForm(false)} className="btn-ghost">Cancelar</button>
          </form>
        )}

        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Sin egresos registrados</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((exp) => (
              <li key={exp.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{exp.description}</span>
                  {exp.registered_by && <span className="text-xs text-gray-400 ml-1">· {exp.registered_by.name}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-600">−{formatCurrency(exp.amount)}</span>
                  <button
                    onClick={() => deleteExpense.mutate(exp.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={showClose}
        title="¿Cerrar la caja?"
        description={`Esto cerrará el corte actual. Ventas: ${formatCurrency(cashRegister.total_sales)} · Neto: ${formatCurrency(cashRegister.net_amount)}`}
        confirmLabel="Cerrar caja"
        variant="danger"
        isLoading={closeRegister.isPending}
        onConfirm={() => closeRegister.mutate()}
        onCancel={() => setShowClose(false)}
      />
    </div>
  )
}
