/**
 * Meal create/edit form for admin inventory management.
 */
import { useState } from 'react'
import { Loader2, Save, Plus } from 'lucide-react'
import styles from './AdminMealForm.module.css'

export default function AdminMealForm({ editingMeal, saving, uploading, onSubmit, onCancelEdit }) {
  const [form, setForm] = useState(() => ({
    name: editingMeal?.name ?? '',
    description: editingMeal?.description ?? '',
    imageUrl: editingMeal?.imageUrl ?? '',
  }))
  const [imageFile, setImageFile] = useState(null)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ ...form, imageFile })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>{editingMeal ? 'Edit meal' : 'Add meal'}</h2>
      <label className={styles.label}>
        Name
        <input
          className={styles.input}
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
      </label>
      <label className={styles.label}>
        Description
        <textarea
          className={styles.textarea}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
        />
      </label>
      <label className={styles.label}>
        Image {editingMeal ? '(optional replace)' : ''}
        <input
          className={styles.input}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {form.imageUrl ? (
        <img className={styles.preview} src={form.imageUrl} alt={`${form.name || 'Meal'} preview`} />
      ) : null}
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={saving || uploading}>
          {saving || uploading ? (
            <>
              <Loader2 size={16} className={styles.spin} aria-hidden />
              Saving
            </>
          ) : editingMeal ? (
            <>
              <Save size={16} aria-hidden />
              Update meal
            </>
          ) : (
            <>
              <Plus size={16} aria-hidden />
              Add meal
            </>
          )}
        </button>
        {editingMeal ? (
          <button type="button" className={styles.secondary} onClick={onCancelEdit}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
