import { useEffect, useState } from 'react'
import { firebaseConfigured } from '../firebase/config'
import { subscribeOrderForSession } from '../services/passengerOrderService'

export function useOrderForSession(flightInstanceId, seatNumber) {
  const [liveOrder, setLiveOrder] = useState(null)
  const [orderSubError, setOrderSubError] = useState('')

  useEffect(() => {
    if (!firebaseConfigured || !flightInstanceId || !seatNumber) {
      setLiveOrder(null)
      setOrderSubError('')
      return () => {}
    }
    setOrderSubError('')
    return subscribeOrderForSession(
      flightInstanceId,
      seatNumber,
      (order) => setLiveOrder(order),
      (err) => setOrderSubError(err?.message ?? 'Could not subscribe to order.'),
    )
  }, [flightInstanceId, seatNumber])

  return { liveOrder, orderSubError }
}
