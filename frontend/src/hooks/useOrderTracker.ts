import { useEffect, useState } from 'react'
import type { OrderStatus } from '@/types/models'

interface TrackerState {
  status: OrderStatus
  orderNumber: string
  confirmedAt: string | null
  cancelledAt: string | null
  connected: boolean
}

export function useOrderTracker(orderId: string | number) {
  const [state, setState] = useState<TrackerState>({
    status: 'pending',
    orderNumber: '',
    confirmedAt: null,
    cancelledAt: null,
    connected: false,
  })

  useEffect(() => {
    const es = new EventSource(`/api/orders/${orderId}/track`)

    es.onopen = () => setState((s) => ({ ...s, connected: true }))

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setState((s) => ({
        ...s,
        status: data.status,
        orderNumber: data.order_number,
        confirmedAt: data.confirmed_at,
        cancelledAt: data.cancelled_at,
      }))
    }

    es.addEventListener('close', () => {
      setState((s) => ({ ...s, connected: false }))
      es.close()
    })

    es.onerror = () => {
      setState((s) => ({ ...s, connected: false }))
    }

    return () => es.close()
  }, [orderId])

  return state
}
