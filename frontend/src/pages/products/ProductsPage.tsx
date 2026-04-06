import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Power } from 'lucide-react'
import { productsApi } from '@/api/products'
import { useToast } from '@/components/shared/Toast'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name:        z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  price:       z.coerce.number().min(0, 'Precio inválido'),
  image_url:   z.string().url('URL inválida').optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

function ProductForm({
  defaultValues,
  onSave,
  onCancel,
  isLoading,
}: {
  defaultValues?: Partial<FormData>
  onSave: (data: FormData) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any, // z.coerce type workaround
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nombre *</label>
          <input {...register('name')} className="input" />
          {errors.name && <p className="mt-0.5 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Precio *</label>
          <input type="number" step="0.01" min={0} {...register('price')} className="input" />
          {errors.price && <p className="mt-0.5 text-xs text-red-600">{errors.price.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Descripción</label>
        <input {...register('description')} className="input" />
      </div>
      <div>
        <label className="label">URL de imagen</label>
        <input {...register('image_url')} type="url" className="input" placeholder="https://..." />
        {errors.image_url && <p className="mt-0.5 text-xs text-red-600">{errors.image_url.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={isLoading}>Guardar</button>
      </div>
    </form>
  )
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const [editId, setEditId]         = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  })

  const create = useMutation({
    mutationFn: (data: FormData) =>
      productsApi.create({
        name:        data.name,
        description: data.description ?? undefined,
        price:       data.price,
        image_url:   data.image_url ?? undefined,
        is_active:   true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast('Producto creado')
      setShowCreate(false)
    },
    onError: () => toast('Error al crear producto', 'error'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      productsApi.update(id, {
        name:        data.name,
        description: data.description ?? undefined,
        price:       data.price,
        image_url:   data.image_url ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast('Producto actualizado')
      setEditId(null)
    },
    onError: () => toast('Error al actualizar', 'error'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      productsApi.update(id, { is_active: active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Productos</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {showCreate && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Nuevo producto</h2>
          <ProductForm
            onSave={(d) => create.mutate(d)}
            onCancel={() => setShowCreate(false)}
            isLoading={create.isPending}
          />
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState title="Sin productos" description="Crea tu primer producto para comenzar." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Precio</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <Fragment key={product.id}>
                    <tr className="hover:bg-surface-subtle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-8 w-8 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-sm">🍽️</div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={product.is_active ? 'badge-confirmed' : 'badge-cancelled'}>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditId(editId === product.id ? null : product.id)}
                            className="btn-ghost p-2"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActive.mutate({ id: product.id, active: ! product.is_active })}
                            className="btn-ghost p-2"
                            title={product.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <Power className={`h-3.5 w-3.5 ${product.is_active ? 'text-emerald-500' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editId === product.id && (
                      <tr key={`edit-${product.id}`}>
                        <td colSpan={4} className="px-4 py-3 bg-surface-subtle">
                          <ProductForm
                            defaultValues={{
                              name:        product.name,
                              description: product.description ?? '',
                              price:       product.price,
                              image_url:   product.image_url ?? '',
                            }}
                            onSave={(d) => update.mutate({ id: product.id, data: d })}
                            onCancel={() => setEditId(null)}
                            isLoading={update.isPending}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
