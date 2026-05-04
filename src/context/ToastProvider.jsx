import { useState, useCallback } from 'react'
import { ToastContext } from './toastContext'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }

    setToasts((prev) => [...prev, toast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration = 4000) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const showError = useCallback((message, duration = 4000) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const showWarning = useCallback((message, duration = 4000) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const showInfo = useCallback((message, duration = 4000) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  const confirm = useCallback((message, onConfirm, onCancel) => {
    const id = addToast(message, 'confirm', 0) // No auto-remove for confirm

    // Store callbacks for later use
    const toast = { id, message, type: 'confirm', onConfirm, onCancel }

    // Override the toast with confirm type
    setToasts((prev) => [...prev.filter((t) => t.id !== id), toast])

    return id
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    confirm,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}