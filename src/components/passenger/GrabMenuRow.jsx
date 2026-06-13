/**
 * Meal card for the passenger dashboard.
 */
import { ChevronRight, Utensils } from 'lucide-react'
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
          <div className={styles.ph} aria-hidden>
            <Utensils size={24} />
          </div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{item.name}</h2>
          <span className={`${styles.stockBadge} ${out ? styles.outBadge : ''}`}>
            {out ? 'Unavailable' : `${item.stock} left`}
          </span>
        </div>
        {item.description ? <p className={styles.desc}>{item.description}</p> : null}
        {item.allergens?.length ? (
          <p className={styles.allergens}>Contains: {item.allergens.join(', ')}</p>
        ) : null}
        <p className={styles.meta}>{out ? 'Ask crew for alternatives' : 'Customize and order'}</p>
      </div>
      <span className={styles.cta} aria-hidden>
        <ChevronRight size={22} strokeWidth={2} />
      </span>
    </button>
  )
}
