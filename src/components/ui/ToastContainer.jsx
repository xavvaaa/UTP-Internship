import { useToast } from '../../context/useToast'
import Toast from './Toast'
import styles from './ToastContainer.module.css'

export default function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <>
      <div className={styles.backdrop} />
      <div className={styles.container}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  )
}