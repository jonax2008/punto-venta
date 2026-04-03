import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { usersApi } from '@/api/users'
import { groupsApi } from '@/api/groups'
import { useToast } from '@/components/shared/Toast'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { ROLE_LABELS } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  name:     z.string().min(1, 'Nombre requerido'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role:     z.enum(['group_manager', 'cashier']),
  group_id: z.coerce.number().min(1, 'Grupo requerido'),
})
type FormData = z.infer<typeof schema>

export function UsersPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()
  const { user }    = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId]     = useState<number | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema) as any, // z.coerce type workaround
    defaultValues: { group_id: user?.group_id ?? undefined },
  })

  const createUser = useMutation({
    mutationFn: (data: FormData) => usersApi.create({ ...data, role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast('Usuario creado')
      setShowCreate(false)
      reset()
    },
    onError: () => toast('Error al crear usuario', 'error'),
  })

  const deleteUser = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast('Usuario eliminado')
      setDeleteId(null)
    },
    onError: () => toast('Error al eliminar', 'error'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
        <button onClick={() => setShowCreate(! showCreate)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {showCreate && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Nuevo usuario</h2>
          <form onSubmit={handleSubmit((d) => createUser.mutate(d as FormData))} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Nombre *</label>
                <input {...register('name')} className="input" />
                {errors.name && <p className="text-xs text-red-600 mt-0.5">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" {...register('email')} className="input" />
                {errors.email && <p className="text-xs text-red-600 mt-0.5">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Contraseña *</label>
                <input type="password" {...register('password')} className="input" />
                {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Rol *</label>
                <select {...register('role')} className="input">
                  <option value="cashier">Cajero/Vendedor</option>
                  <option value="group_manager">Encargado de grupo</option>
                </select>
              </div>
              <div>
                <label className="label">Grupo *</label>
                <select {...register('group_id')} className="input">
                  <option value="">Seleccionar grupo...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                {errors.group_id && <p className="text-xs text-red-600 mt-0.5">{errors.group_id.message}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary" disabled={createUser.isPending}>Crear usuario</button>
            </div>
          </form>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState title="Sin usuarios" description="Crea el primer usuario del sistema." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Grupo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-subtle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ROLE_LABELS[u.role]}</td>
                    <td className="px-4 py-3 text-gray-600">{u.group?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="btn-ghost p-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                          disabled={u.id === user?.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="¿Eliminar usuario?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteUser.isPending}
        onConfirm={() => deleteUser.mutate(deleteId!)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
