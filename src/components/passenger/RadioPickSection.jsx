/**
 * One "Pick 1" group (Grab-style customization).
 */
import styles from './RadioPickSection.module.css'

export default function RadioPickSection({ title, name, options, value, onChange, disabled }) {
  return (
    <section className={styles.section} aria-labelledby={`${name}-heading`}>
      <div className={styles.head}>
        <h3 id={`${name}-heading`} className={styles.heading}>
          {title}
        </h3>
        <span className={styles.badge}>Pick 1</span>
      </div>
      <ul className={styles.list} role="radiogroup" aria-label={title}>
        {options.map((opt) => {
          const id = `${name}-${opt.value === '' ? 'none' : opt.value}`
          const checked = value === opt.value
          const rowDisabled = disabled || opt.disabled
          return (
            <li key={opt.value === '' ? 'none' : opt.value}>
              <label className={`${styles.row} ${checked ? styles.rowActive : ''} ${rowDisabled ? styles.rowDisabled : ''}`}>
                <input
                  id={id}
                  className={styles.input}
                  type="radio"
                  name={name}
                  value={opt.value === '' ? '' : opt.value}
                  checked={checked}
                  onChange={() => onChange(opt.value)}
                  disabled={rowDisabled}
                />
                <span className={styles.label}>{opt.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
