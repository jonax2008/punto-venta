import type { OrderStatus } from '@/types/models'
import { ORDER_STATUS_LABELS } from '@/lib/utils'

interface Props {
  status: OrderStatus
}

const classMap: Record<OrderStatus, string> = {
  pending:   'badge-pending',
  confirmed: 'badge-confirmed',
  preparing: 'badge-preparing',
  ready:     'badge-ready',
  cancelled: 'badge-cancelled',
}

export function OrderStatusBadge({ status }: Props) {
  return <span className={classMap[status]}>{ORDER_STATUS_LABELS[status]}</span>
}
