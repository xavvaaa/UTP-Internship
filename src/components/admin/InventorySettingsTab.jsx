/**
 * Inventory Settings Tab
 * Configure default stock levels and low stock alerts
 */
import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { useToast } from '../../context/useToast'
import { getAuthToken } from '../../utils/authToken'
import {
  getInventorySettings,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../../services/admin/adminManagementService'
import styles from './InventorySettingsTab.module.css'

export default function InventorySettingsTab() {
  const { showSuccess, showError } = useToast()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    defaultStock: 100,
    lowThreshold: 20,
    category: '',
  })

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getAuthToken()
      const result = await getInventorySettings(token)

      if (result.ok) {
        setItems(result.items || [])
      } else {
        showError(result.error || 'Failed to fetch inventory')
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
      showError('Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showError('Item name is required')
      return
    }

    if (parseInt(formData.defaultStock, 10) < 0) {
      showError('Default stock cannot be negative')
      return
    }

    if (parseInt(formData.lowThreshold, 10) < 0) {
      showError('Low threshold cannot be negative')
      return
    }

    if (parseInt(formData.lowThreshold, 10) > parseInt(formData.defaultStock, 10)) {
      showError('Low threshold cannot exceed default stock')
      return
    }

    try {
      setSaving(true)
      const token = await getAuthToken()

      if (editingId) {
        const result = await updateInventoryItem(editingId, formData, token)
        if (result.ok) {
          showSuccess('Inventory item updated successfully')
        } else {
          showError(result.error || 'Failed to update item')
        }
      } else {
        const result = await createInventoryItem(formData, token)
        if (result.ok) {
          showSuccess('Inventory item created successfully')
        } else {
          showError(result.error || 'Failed to create item')
        }
      }

      setFormData({ name: '', defaultStock: 100, lowThreshold: 20, category: '' })
      setEditingId(null)
      setShowForm(false)
      await fetchItems()
    } catch (err) {
      console.error('Error saving item:', err)
      showError('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return
    }

    try {
      const token = await getAuthToken()
      const result = await deleteInventoryItem(itemId, token)

      if (result.ok) {
        showSuccess('Inventory item deleted successfully')
        await fetchItems()
      } else {
        showError(result.error || 'Failed to delete item')
      }
    } catch (err) {
      console.error('Error deleting item:', err)
      showError('Failed to delete item')
    }
  }

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      defaultStock: item.defaultStock,
      lowThreshold: item.lowThreshold,
      category: item.category,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  return (
    <div className={styles.container}>
      {/* Form */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3>{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
            <button
              className={styles.closeBtn}
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setFormData({ name: '', defaultStock: 100, lowThreshold: 20, category: '' })
              }}
            >
              ✕
            </button>
          </div>

          <div className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chicken Breast"
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Proteins"
                  disabled={saving}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Default Stock Level</label>
                <input
                  type="number"
                  value={formData.defaultStock}
                  onChange={(e) => setFormData({ ...formData, defaultStock: parseInt(e.target.value, 10) })}
                  placeholder="0"
                  disabled={saving}
                  min="0"
                />
                <small>Initial stock quantity to set</small>
              </div>

              <div className={styles.formGroup}>
                <label>Low Stock Threshold</label>
                <input
                  type="number"
                  value={formData.lowThreshold}
                  onChange={(e) => setFormData({ ...formData, lowThreshold: parseInt(e.target.value, 10) })}
                  placeholder="0"
                  disabled={saving}
                  min="0"
                />
                <small>Alert when stock falls below this</small>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !formData.name}
              >
                {saving ? 'Saving...' : 'Save Item'}
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ name: '', defaultStock: 100, lowThreshold: 20, category: '' })
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
        <h3>Inventory Configuration ({items.length})</h3>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.message}>Loading inventory...</div>
      ) : items.length === 0 ? (
        <div className={styles.message}>
          No inventory items configured yet.{' '}
          <button className={styles.linkBtn} onClick={() => setShowForm(true)}>
            Add one
          </button>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                {item.category && <span className={styles.itemCategory}>{item.category}</span>}
              </div>

              <div className={styles.stockInfo}>
                <div className={styles.stockItem}>
                  <span className={styles.label}>Default</span>
                  <span className={styles.value}>{item.defaultStock}</span>
                </div>

                <div className={styles.stockItem}>
                  <span className={styles.label}>Low Alert</span>
                  <span className={`${styles.value} ${styles.threshold}`}>
                    <AlertCircle size={14} />
                    {item.lowThreshold}
                  </span>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEdit(item)}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className={styles.infoBox}>
        <AlertCircle size={16} />
        <div>
          <strong>Stock Management:</strong> These settings define default stock levels for menu items.
          When stock falls below the threshold, admins will receive alerts to reorder supplies.
        </div>
      </div>
    </div>
  )
}
