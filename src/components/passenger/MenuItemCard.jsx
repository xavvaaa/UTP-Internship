/**
 * Single-select menu item card (radio-style) with stock state.
 */
import { Check } from 'lucide-react'
import styles from './MenuItemCard.module.css'

const CATEGORY_LABEL = {
  meal: 'Meal',
  drink: 'Drink',
  dessert: 'Dessert',
  snack: 'Snack',
}

export default function MenuItemCard({ item, selected, disabled, onSelect }) {
  const out = !item.available || item.stock <= 0
  const active = selected === item.id
  const blocked = disabled || out

  return (
    <button
      type="button"
      className={`${styles.card} ${active ? styles.cardActive : ''} ${out ? styles.out : ''}`}
      onClick={() => !blocked && onSelect(item.id)}
      disabled={blocked}
      aria-pressed={active}
    >
      <div className={styles.imageWrap}>
        {item.imageUrl ? (
          <img className={styles.image} src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.name}>{item.name}</h2>
          {active ? (
            <span className={styles.check} aria-hidden>
              <Check size={18} strokeWidth={2.5} />
            </span>
          ) : null}
        </div>
        <p className={styles.category}>{CATEGORY_LABEL[item.category] ?? item.category}</p>
        {item.description ? <p className={styles.desc}>{item.description}</p> : null}
        {item.allergens?.length ? (
          <p className={styles.allergens}>
            Contains: {item.allergens.join(', ')}
          </p>
        ) : null}
        <p className={styles.stock}>
          {out ? 'Out of stock' : `In stock: ${item.stock}`}
        </p>
      </div>
    </button>
  )
}
