/**
 * Mobile-first page frame with optional top bar actions.
 */
import styles from './PageShell.module.css'

export default function PageShell({ title, subtitle, actions, children, footer }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          {title ? <h1 className={styles.title}>{title}</h1> : null}
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <main className={styles.main}>{children}</main>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  )
}
