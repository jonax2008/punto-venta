import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups'
import { usersApi } from '@/api/users'
import { useToast } from '@/components/shared/Toast'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import { Users } from 'lucide-react'

export function GroupsPage() {
  const queryClient = useQueryClient()
  const { toast }   = useToast()

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const updateGroup = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof groupsApi.update>[1] }) =>
      groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast('Grupo actualizado')
    },
    onError: () => toast('Error al actualizar grupo', 'error'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Grupos</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => {
          const groupUsers = users.filter((u) => u.group_id === group.id && u.role !== 'client')

          return (
            <div key={group.id} className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{group.name}</h2>
                    <span className={group.is_active ? 'badge-confirmed' : 'badge-cancelled'}>
                      {group.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => updateGroup.mutate({ id: group.id, data: { is_active: ! group.is_active } })}
                  className="btn-secondary py-1.5 text-xs"
                >
                  {group.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>

              {/* Encargado */}
              <div>
                <label className="label">Encargado del grupo</label>
                <select
                  className="input"
                  value={group.manager?.id ?? ''}
                  onChange={(e) =>
                    updateGroup.mutate({
                      id: group.id,
                      data: { manager_id: e.target.value ? Number(e.target.value) : null },
                    })
                  }
                >
                  <option value="">Sin encargado</option>
                  {users
                    .filter((u) => u.group_id === group.id || u.group_id === null)
                    .filter((u) => u.role !== 'admin' && u.role !== 'client')
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                    ))}
                </select>
              </div>

              {/* Usuarios del grupo */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Integrantes ({groupUsers.length})
                </p>
                {groupUsers.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin usuarios asignados</p>
                ) : (
                  <ul className="space-y-1">
                    {groupUsers.map((u) => (
                      <li key={u.id} className="flex items-center gap-2 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                          {u.name.charAt(0)}
                        </div>
                        <span className="text-gray-700">{u.name}</span>
                        <span className="text-xs text-gray-400">
                          ({u.role === 'group_manager' ? 'Encargado' : 'Cajero'})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
