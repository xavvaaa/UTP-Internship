import { useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast } from '../../context/useToast'
import styles from './Toast.module.css'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  confirm: AlertTriangle,
}

export default function Toast({ toast }) {
  const { removeToast } = useToast()

  useEffect(() => {
    if (toast.type !== 'confirm' && toast.duration > 0) {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast, removeToast])

  const Icon = ICONS[toast.type] || ICONS.info

  const handleConfirm = () => {
    if (toast.onConfirm) {
      toast.onConfirm()
    }
    removeToast(toast.id)
  }

  const handleCancel = () => {
    if (toast.onCancel) {
      toast.onCancel()
    }
    removeToast(toast.id)
  }

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <div className={styles.content}>
        <Icon className={styles.icon} size={20} />
        <span className={styles.message}>{toast.message}</span>
        {toast.type === 'confirm' ? (
          <div className={styles.actions}>
            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
            >
              Yes
            </button>
            <button
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              No
            </button>
          </div>
        ) : (
          <button
            className={styles.closeBtn}
            onClick={() => removeToast(toast.id)}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}