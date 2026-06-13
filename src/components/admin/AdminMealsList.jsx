/**
 * Admin menu list with edit/delete controls and availability states.
 */
import { Pencil, Trash2 } from 'lucide-react'
import styles from './AdminMealsList.module.css'

export default function AdminMealsList({ meals, onEdit, onDelete }) {
  return (
    <section className={styles.wrap}>
      <h2 className={styles.title}>Menu</h2>
      <ul className={styles.list}>
        {meals.map((meal) => (
          <li key={meal.id} className={styles.card}>
            {meal.imageUrl ? <img className={styles.image} src={meal.imageUrl} alt={meal.name} /> : null}
            <div className={styles.content}>
              <div className={styles.row}>
                <strong>{meal.name}</strong>
                <span className={meal.available ? styles.available : styles.unavailable}>
                  {meal.available ? 'Available' : 'Out of stock'}
                </span>
              </div>
              <p className={styles.description}>{meal.description || 'No description'}</p>
              <p className={styles.stock}>Stock: {meal.stock}</p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.iconBtn} onClick={() => onEdit(meal)} aria-label="Edit meal">
                <Pencil size={16} aria-hidden />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => onDelete(meal)}
                aria-label="Delete meal"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
