/**
 * Admin layout wrapper with sidebar navigation
 */
import styles from './AdminLayout.module.css'

export default function AdminLayout({ sidebar, children }) {
  return (
    <div className={styles.adminLayout}>
      {sidebar}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
