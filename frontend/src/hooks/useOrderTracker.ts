import { useEffect, useState } from 'react'
import type { OrderStatus } from '@/types/models'

interface TrackerState {
  status: OrderStatus
  orderNumber: string
  clientName: string | null
  confirmedAt: string | null
  preparedAt: string | null
  readyAt: string | null
  cancelledAt: string | null
  connected: boolean
}

export function useOrderTracker(orderId: string | number) {
  const [state, setState] = useState<TrackerState>({
    status: 'pending',
    orderNumber: '',
    clientName: null,
    confirmedAt: null,
    preparedAt: null,
    readyAt: null,
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
        clientName: data.client_name,
        confirmedAt: data.confirmed_at,
        preparedAt: data.prepared_at,
        readyAt: data.ready_at,
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
