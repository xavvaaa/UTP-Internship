/**
 * Menu Categories Tab
 * Organize and manage menu categories
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '../../context/useToast'
import { getAuthToken } from '../../utils/authToken'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/admin/adminManagementService'
import styles from './MenuCategoriesTab.module.css'

const EMOJI_OPTIONS = ['🍽️', '🥗', '🍜', '🍱', '🥘', '🍕', '🌮', '☕', '🧃', '🍰', '🍪', '🥛']

export default function MenuCategoriesTab() {
  const { showSuccess, showError } = useToast()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🍽️',
    color: '#667eea',
  })

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      const result = await getCategories(token)

      if (result.ok) {
        setCategories(result.categories || [])
      } else {
        showError(result.error || 'Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      showError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showError('Category name is required')
      return
    }

    try {
      setSaving(true)
      const token = await getAuthToken()

      if (editingId) {
        const result = await updateCategory(editingId, formData, token)
        if (result.ok) {
          showSuccess('Category updated successfully')
        } else {
          showError(result.error || 'Failed to update category')
        }
      } else {
        const result = await createCategory(formData, token)
        if (result.ok) {
          showSuccess('Category created successfully')
        } else {
          showError(result.error || 'Failed to create category')
        }
      }

      setFormData({ name: '', description: '', icon: '🍽️', color: '#667eea' })
      setEditingId(null)
      setShowForm(false)
      await fetchCategories()
    } catch (err) {
      console.error('Error saving category:', err)
      showError('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const token = await getAuthToken()
      const result = await deleteCategory(categoryId, token)

      if (result.ok) {
        showSuccess('Category deleted successfully')
        await fetchCategories()
      } else {
        showError(result.error || 'Failed to delete category')
      }
    } catch (err) {
      console.error('Error deleting category:', err)
      showError('Failed to delete category')
    }
  }

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  return (
    <div className={styles.container}>
      {/* Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3>{editingId ? 'Edit Category' : 'Create Category'}</h3>
            <button
              className={styles.closeBtn}
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setFormData({ name: '', description: '', icon: '🍽️', color: '#667eea' })
              }}
            >
              ✕
            </button>
          </div>

          <div className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Meals"
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Icon</label>
                <div className={styles.emojiPicker}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`${styles.emojiBtn} ${formData.icon === emoji ? styles.selectedEmoji : ''}`}
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      disabled={saving}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                disabled={saving}
                rows="2"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Color</label>
                <div className={styles.colorPicker}>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    disabled={saving}
                  />
                  <span
                    className={styles.colorPreview}
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>

              <div className={styles.preview}>
                <div className={styles.previewLabel}>Preview</div>
                <div
                  className={styles.categoryPreview}
                  style={{ backgroundColor: formData.color }}
                >
                  <span className={styles.previewIcon}>{formData.icon}</span>
                  <span className={styles.previewName}>{formData.name || 'Category'}</span>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !formData.name}
              >
                {saving ? 'Saving...' : 'Save Category'}
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ name: '', description: '', icon: '🍽️', color: '#667eea' })
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.listHeader}>
        <h3>Menu Categories ({categories.length})</h3>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.message}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className={styles.message}>
          No categories yet.{' '}
          <button className={styles.linkBtn} onClick={() => setShowForm(true)}>
            Create one
          </button>
        </div>
      ) : (
        <div className={styles.categoriesList}>
          {categories.map((category) => (
            <div key={category.id} className={styles.categoryCard}>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                <div className={styles.categoryDetails}>
                  <span className={styles.categoryName}>{category.name}</span>
                  {category.description && (
                    <span className={styles.categoryDesc}>{category.description}</span>
                  )}
                </div>
                <div
                  className={styles.colorDot}
                  style={{ backgroundColor: category.color }}
                />
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEdit(category)}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(category.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
