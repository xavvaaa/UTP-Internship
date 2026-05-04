/**
 * Grouped menu items for one category (tabs content).
 */
import MenuItemCard from './MenuItemCard'
import styles from './CategorySection.module.css'

export default function CategorySection({ title, items, selectedId, onSelect, disabled }) {
  if (!items.length) {
    return (
      <section className={styles.wrap}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.empty}>No items in this category.</p>
      </section>
    )
  }

  return (
    <section className={styles.wrap}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <MenuItemCard
              item={item}
              selected={selectedId}
              disabled={disabled}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
