import { X, AlertTriangle, Trash2, Square, Info } from 'lucide-react'
import styles from './ConfirmDialog.module.css'

export default function ConfirmDialog({ 
  isOpen, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'OK', 
  cancelText = 'Cancel',
  title = 'Confirm Action',
  type = 'warning' // warning, danger, info
}) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={24} />
      case 'warning':
        return <AlertTriangle size={24} />
      case 'info':
        return <Info size={24} />
      default:
        return <AlertTriangle size={24} />
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return '#dc3545'
      case 'warning':
        return '#fd7e14'
      case 'info':
        return '#17a2b8'
      default:
        return '#fd7e14'
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'danger':
        return 'This action cannot be undone. Please be certain before proceeding.'
      case 'warning':
        return 'This will affect the current session and related data.'
      case 'info':
        return 'Please review the information before confirming.'
      default:
        return 'Please review the action before proceeding.'
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.iconContainer} style={{ color: getIconColor() }}>
              {getIcon()}
            </div>
            <h3>{title}</h3>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onCancel}
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.messageContainer}>
            <p className={styles.mainMessage}>{message}</p>
            <p className={styles.description}>{getDescription()}</p>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.cancelBtn}`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.confirmBtn} ${styles[type]}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
