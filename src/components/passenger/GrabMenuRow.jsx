/**
 * Grab-style meal row: image, title, description, chevron. Navigates to customize.
 */
import { ChevronRight } from 'lucide-react'
import styles from './GrabMenuRow.module.css'

export default function GrabMenuRow({ item, onOpen, disabled }) {
  const out = !item.available || item.stock <= 0
  const blocked = disabled || out

  return (
    <button
      type="button"
      className={`${styles.row} ${out ? styles.out : ''}`}
      onClick={() => !blocked && onOpen(item.id)}
      disabled={blocked}
    >
      <div className={styles.thumb}>
        {item.imageUrl ? (
          <img className={styles.img} src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className={styles.ph} aria-hidden />
        )}
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{item.name}</h2>
        {item.description ? <p className={styles.desc}>{item.description}</p> : null}
        <p className={styles.meta}>{out ? 'Unavailable' : `From menu · ${item.stock} left`}</p>
      </div>
      <span className={styles.cta} aria-hidden>
        <ChevronRight size={22} strokeWidth={2} />
      </span>
    </button>
  )
}
