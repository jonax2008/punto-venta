import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { groupsApi } from '@/api/groups'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { BarChart3, TrendingUp, Archive } from 'lucide-react'

type Tab = 'by-group' | 'top-products' | 'cash-registers'

function DateFilter({
  from, to, onChange,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">Desde</label>
        <input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className="input py-1.5 text-sm" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">Hasta</label>
        <input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className="input py-1.5 text-sm" />
      </div>
    </div>
  )
}

export function ReportsPage() {
  const [tab, setTab]   = useState<Tab>('by-group')
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [to, setTo]     = useState(new Date().toISOString().split('T')[0])
  const [groupId, setGroupId] = useState<string>('')

  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: groupsApi.list })

  const { data: byGroup, isLoading: loadingGroup } = useQuery({
    queryKey: ['reports', 'by-group', from, to],
    queryFn: () => reportsApi.salesByGroup({ from, to }),
    enabled: tab === 'by-group',
  })

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['reports', 'top-products', from, to, groupId],
    queryFn: () => reportsApi.topProducts({ from, to, group_id: groupId ? Number(groupId) : undefined }),
    enabled: tab === 'top-products',
  })

  const { data: cashHistory, isLoading: loadingCash } = useQuery({
    queryKey: ['reports', 'cash-registers', from, to, groupId],
    queryFn: () => reportsApi.cashRegisterHistory({ from, to, group_id: groupId ? Number(groupId) : undefined }),
    enabled: tab === 'cash-registers',
  })

  const handleDateChange = (f: string, t: string) => { setFrom(f); setTo(t) }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Reportes</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {([
          { id: 'by-group' as Tab, label: 'Por grupo', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'top-products' as Tab, label: 'Productos', icon: <TrendingUp className="h-4 w-4" /> },
          { id: 'cash-registers' as Tab, label: 'Cortes', icon: <Archive className="h-4 w-4" /> },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <DateFilter from={from} to={to} onChange={handleDateChange} />
        {tab !== 'by-group' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Grupo</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="input py-1.5 text-sm">
              <option value="">Todos</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Contenido de tabs */}
      {tab === 'by-group' && (
        loadingGroup ? <PageLoader /> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Grupo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Pedidos</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Ventas totales</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Promedio/pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(byGroup?.data ?? []).map((row) => (
                  <tr key={row.group_id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.group_name}</td>
                    <td className="px-4 py-3 text-right">{row.total_orders}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.total_sales)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {row.total_orders > 0 ? formatCurrency(row.total_sales / row.total_orders) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-surface-subtle font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">
                    {(byGroup?.data ?? []).reduce((a, r) => a + r.total_orders, 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency((byGroup?.data ?? []).reduce((a, r) => a + r.total_sales, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}

      {tab === 'top-products' && (
        loadingProducts ? <PageLoader /> : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Unidades</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(topProducts?.data ?? []).map((row, idx) => (
                  <tr key={row.product_id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.product_name}</td>
                    <td className="px-4 py-3 text-right">{row.total_quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'cash-registers' && (
        loadingCash ? <PageLoader /> : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-surface-subtle border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Grupo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Apertura</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Cierre</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Ventas</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Egresos</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Neto</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {((cashHistory as { data: any[] })?.data ?? []).map((row: any) => (
                    <tr key={row.id} className="hover:bg-surface-subtle">
                      <td className="px-4 py-3 font-medium">{row.group}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDateShort(row.opened_at)} · {row.opened_by}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {row.closed_at ? `${formatDateShort(row.closed_at)} · ${row.closed_by}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.total_sales)}</td>
                      <td className="px-4 py-3 text-right text-red-500">−{formatCurrency(row.total_expenses)}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(row.net_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={row.status === 'open' ? 'badge-confirmed' : 'badge-cancelled'}>
                          {row.status === 'open' ? 'Abierta' : row.auto_closed ? 'Auto-cerrada' : 'Cerrada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
