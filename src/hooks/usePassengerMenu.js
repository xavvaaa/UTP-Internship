import { useEffect, useState } from 'react'
import { firebaseConfigured } from '../firebase/config'
import { subscribeMenu } from '../services/menuService'

export function usePassengerMenu(flightInstanceId) {
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState('')

  useEffect(() => {
    if (!firebaseConfigured) {
      setMenuLoading(false)
      setMenuError('Connect Firebase (see .env.example).')
      setMenuItems([])
      return () => {}
    }
    const fid = String(flightInstanceId ?? '').trim()
    if (!fid) {
      setMenuItems([])
      setMenuLoading(false)
      setMenuError('')
      return () => {}
    }

    setMenuError('')
    return subscribeMenu(
      (list) => {
        setMenuItems(list)
        setMenuLoading(false)
        setMenuError('')
      },
      (err) => {
        setMenuItems([])
        setMenuLoading(false)
        setMenuError(err?.message ?? 'Could not load menu.')
      },
      fid,
    )
  }, [flightInstanceId])

  return { menuItems, menuLoading, menuError }
}
