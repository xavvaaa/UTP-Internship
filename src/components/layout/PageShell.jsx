/**
 * Mobile-first page frame with optional top bar actions.
 */
import styles from './PageShell.module.css'

export default function PageShell({ title, subtitle, actions, children, footer, hideHeader = false }) {
  const showHeader = !hideHeader && (title || subtitle || actions)

  return (
    <div className={styles.shell}>
      {showHeader ? (
        <header className={styles.header}>
          <div className={styles.headerText}>
            {title ? <h1 className={styles.title}>{title}</h1> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <main className={styles.main}>{children}</main>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  )
}
