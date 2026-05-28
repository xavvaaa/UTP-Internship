/**
 * Single meal row with image, text, and radio-style single selection.
 */
import { Check } from 'lucide-react'
import styles from './MealCard.module.css'

export default function MealCard({ meal, selected, disabled, onSelect }) {
  const active = selected === meal.id

  return (
    <button
      type="button"
      className={`${styles.card} ${active ? styles.cardActive : ''}`}
      onClick={() => !disabled && onSelect(meal.id)}
      disabled={disabled}
      aria-pressed={active}
    >
      <div className={styles.imageWrap}>
        {meal.imageUrl ? (
          <img className={styles.image} src={meal.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.name}>{meal.name}</h2>
          {active ? (
            <span className={styles.check} aria-hidden>
              <Check size={18} strokeWidth={2.5} />
            </span>
          ) : null}
        </div>
        {meal.description ? <p className={styles.desc}>{meal.description}</p> : null}
      </div>
    </button>
  )
}
