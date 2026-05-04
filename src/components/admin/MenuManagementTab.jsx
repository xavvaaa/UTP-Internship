import { useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Pencil, Trash2, Upload, Plus, Package, AlertTriangle } from 'lucide-react'
import { useToast } from '../../context/useToast'
import styles from './MenuManagementTab.module.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'meal',
  imageUrl: '',
  color: '#3b82f6',
  drinkOptions: [],
  dessertOptions: [],
  snackOptions: [],
  allergens: [],
  stockCount: 100,
  lowStockThreshold: 20,
}

export default function MenuManagementTab({
  role,
  items,
  saving,
  onSave,
  onDelete,
  onUploadImage,
}) {
  const { confirm, showSuccess, showError } = useToast()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newOption, setNewOption] = useState({ drink: '', dessert: '', snack: '', allergen: '' })

  const meals = useMemo(
    () => {
      const filtered = [...items]
        .filter((item) => String(item.category ?? 'meal').toLowerCase() === 'meal')
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
      
            
      return filtered;
    },
    [items],
  )

  const readOnly = role !== 'admin'

  // Helper function to determine stock status
  function getStockStatus(stockCount, lowThreshold) {
    if (stockCount <= 0) return { status: 'out', color: '#ef4444', label: 'Out of Stock', icon: AlertTriangle }
    if (stockCount <= lowThreshold) return { status: 'low', color: '#f59e0b', label: 'Low Stock', icon: AlertTriangle }
    return { status: 'available', color: '#10b981', label: 'Available', icon: CheckCircle2 }
  }

  function resetForm() {
    setEditing(null)
    setForm(EMPTY_FORM)

    setNewOption({ drink: '', dessert: '', snack: '' })
    setShowForm(false)
  }

  function startAdd() {
    resetForm()
    setShowForm(true)
  }

  function beginEdit(item) {
    setEditing(item)
    setForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'meal',
      imageUrl: item.imageUrl || '',
      color: item.color || '#3b82f6',
      drinkOptions: item.drinkOptions || [],
      dessertOptions: item.dessertOptions || [],
      snackOptions: item.snackOptions || [],
      allergens: item.allergens || [],
      stockCount: item.stock || 100, // Map backend 'stock' to form 'stockCount'
      lowStockThreshold: item.lowStockThreshold || 20,
    })
    setNewOption({ drink: '', dessert: '', snack: '', allergen: '' })
    setShowForm(true)
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const url = await onUploadImage(file)
      setForm((prev) => ({ ...prev, imageUrl: url }))
      showSuccess('Image uploaded successfully.')
    } catch (error) {
      showError(error?.message || 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // Map form fields to backend field names
    const backendForm = {
      ...form,
      stock: form.stockCount, // Map form 'stockCount' to backend 'stock'
    }
    delete backendForm.stockCount // Remove the form field name
    
    await onSave(editing?.id || null, backendForm)
    resetForm()
  }

  function addOption(type) {
    const draft = newOption[type]?.trim()
    if (!draft) return
    
    const propertyKey = type === 'allergen' ? 'allergens' : `${type}Options`
    const currentArray = prev => Array.isArray(prev[propertyKey]) ? prev[propertyKey] : []
    
    setForm((prev) => ({
      ...prev,
      [propertyKey]: [...currentArray(prev), draft],
    }))
    setNewOption((prev) => ({ ...prev, [type]: '' }))
  }

  function removeOption(type, index) {
    const propertyKey = type === 'allergen' ? 'allergens' : `${type}Options`
    setForm((prev) => ({
      ...prev,
      [propertyKey]: Array.isArray(prev[propertyKey]) ? prev[propertyKey].filter((_, i) => i !== index) : [],
    }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Menu Management</h2>
          <p className={styles.subtitle}>Manage meals and track stock levels.</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            className={styles.addButton}
            onClick={startAdd}
            disabled={showForm}
          >
            <Plus size={16} />
            Add Meal
          </button>
        )}
      </div>

      {readOnly && (
        <div className={styles.message} data-type="info">
          <span>Crew mode is view-only. Sign in as admin to manage menu items.</span>
        </div>
      )}

      <div className={styles.mealsGrid}>
        {meals.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No meals added yet.</p>
            {!readOnly && (
              <button type="button" className={styles.emptyAction} onClick={startAdd}>
                <Plus size={16} />
                Add Your First Meal
              </button>
            )}
          </div>
        ) : (
          meals.map((item) => (
            <div key={item.id} className={styles.mealCard}>
              {item.imageUrl && (
                <div className={styles.mealImage}>
                  <img src={item.imageUrl} alt={item.name} />
                </div>
              )}

              <div className={styles.mealContent}>
                <div className={styles.mealHeader}>
                  <div className={styles.mealNameRow}>
                    <div 
                      className={styles.colorIndicator} 
                      style={{ backgroundColor: item.color || '#3b82f6' }}
                      title={`Color: ${item.color || 'default (#3b82f6)'}`}
                    ></div>
                    <h4 className={styles.mealName}>{item.name}</h4>
                  </div>
                </div>

                {item.description && (
                  <p className={styles.mealDescription}>{item.description}</p>
                )}

                <div className={styles.optionBadgeRow}>
                  <span className={styles.optionBadge}>Drinks: {item.drinkOptions?.length || 0}</span>
                  <span className={styles.optionBadge}>Desserts: {item.dessertOptions?.length || 0}</span>
                  <span className={styles.optionBadge}>Snacks: {item.snackOptions?.length || 0}</span>
                  {item.allergens?.length ? (
                    <span className={styles.optionBadge}>Allergens: {item.allergens.join(', ')}</span>
                  ) : null}
                </div>

                {/* Stock Status */}
                <div className={styles.stockRow}>
                  {(() => {
                    const stockStatus = getStockStatus(item.stock || 0, item.lowStockThreshold || 20)
                    const StatusIcon = stockStatus.icon
                    return (
                      <div className={styles.stockBadge} style={{ color: stockStatus.color }}>
                        <StatusIcon size={14} />
                        <span>{stockStatus.label}: {item.stock || 0}</span>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {!readOnly && (
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => beginEdit(item)}
                    title="Edit meal"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => {
                      confirm(
                        `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
                        () => onDelete(item.id, item.imageUrl),
                        () => {} // Do nothing on cancel
                      )
                    }}
                    title="Delete meal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div>
                <h3 className={styles.formTitle}>
                  {editing ? 'Edit Meal' : 'Add New Meal'}
                </h3>
                <p className={styles.formSubtitle}>
                  Configure meal details and options.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={resetForm}
                title="Close form"
              >
                ×
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Meal name *
                    <input
                      type="text"
                      className={styles.input}
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter meal name"
                      required
                      disabled={readOnly}
                    />
                  </label>
                </div>

                <div className={styles.formField} data-span="full">
                  <label className={styles.label}>
                    Description
                    <textarea
                      className={styles.textarea}
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the meal..."
                      rows={3}
                      disabled={readOnly}
                    />
                  </label>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Meal Color
                    <div className={styles.colorPickerWrapper}>
                      <input
                        type="color"
                        className={styles.colorPicker}
                        value={form.color || '#3b82f6'}
                        onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                        disabled={readOnly}
                      />
                      <input
                        type="text"
                        className={styles.colorInput}
                        value={form.color || '#3b82f6'}
                        onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#3b82f6"
                        disabled={readOnly}
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </label>
                </div>

                <div className={styles.formField} data-span="full">
                  <label className={styles.label}>
                    Image
                    <div className={styles.uploadArea}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={readOnly || uploading}
                        className={styles.fileInput}
                      />
                      <div className={styles.uploadButton}>
                        <Upload size={16} />
                        {uploading ? 'Uploading...' : 'Choose image'}
                      </div>
                    </div>
                  </label>

                  {form.imageUrl && (
                    <div className={styles.imagePreview}>
                      <img src={form.imageUrl} alt="Meal preview" />
                    </div>
                  )}
                </div>

                {/* Stock Management Fields */}
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Stock Count
                      <input
                        type="number"
                        className={styles.input}
                        value={form.stockCount || 0}
                        onChange={(e) => setForm(prev => ({ ...prev, stockCount: parseInt(e.target.value, 10) || 0 }))}
                        placeholder="100"
                        disabled={readOnly}
                        min="0"
                      />
                      <small>Current available quantity</small>
                    </label>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Low Stock Threshold
                      <input
                        type="number"
                        className={styles.input}
                        value={form.lowStockThreshold || 20}
                        onChange={(e) => setForm(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value, 10) || 20 }))}
                        placeholder="20"
                        disabled={readOnly}
                        min="0"
                      />
                      <small>Alert when stock drops below this level</small>
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.optionSection}>
                <div className={styles.optionSectionHeader}>
                  <div>
                    <h4 className={styles.optionSectionTitle}>Drink options</h4>
                    <p className={styles.optionSectionSubtitle}>Add drinks that passengers can choose with this meal.</p>
                  </div>
                </div>

                <div className={styles.optionList}>
                  {form.drinkOptions.map((option, index) => (
                    <div key={index} className={styles.optionItem}>
                      <span>{option}</span>
                      <button
                        type="button"
                        className={styles.optionRemoveButton}
                        onClick={() => removeOption('drink', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.optionInputRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={newOption.drink}
                    onChange={(e) => setNewOption(prev => ({ ...prev, drink: e.target.value }))}
                    placeholder="Add a drink option"
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className={styles.optionAddButton}
                    onClick={() => addOption('drink')}
                    disabled={readOnly}
                  >
                    Add drink
                  </button>
                </div>
              </div>

              <div className={styles.optionSection}>
                <div className={styles.optionSectionHeader}>
                  <div>
                    <h4 className={styles.optionSectionTitle}>Dessert options</h4>
                    <p className={styles.optionSectionSubtitle}>Add desserts that passengers can choose with this meal.</p>
                  </div>
                </div>

                <div className={styles.optionList}>
                  {form.dessertOptions.map((option, index) => (
                    <div key={index} className={styles.optionItem}>
                      <span>{option}</span>
                      <button
                        type="button"
                        className={styles.optionRemoveButton}
                        onClick={() => removeOption('dessert', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.optionInputRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={newOption.dessert}
                    onChange={(e) => setNewOption(prev => ({ ...prev, dessert: e.target.value }))}
                    placeholder="Add a dessert option"
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className={styles.optionAddButton}
                    onClick={() => addOption('dessert')}
                    disabled={readOnly}
                  >
                    Add dessert
                  </button>
                </div>
              </div>

              <div className={styles.optionSection}>
                <div className={styles.optionSectionHeader}>
                  <div>
                    <h4 className={styles.optionSectionTitle}>Snack options</h4>
                    <p className={styles.optionSectionSubtitle}>Add snacks that passengers can choose with this meal.</p>
                  </div>
                </div>

                <div className={styles.optionList}>
                  {form.snackOptions.map((option, index) => (
                    <div key={index} className={styles.optionItem}>
                      <span>{option}</span>
                      <button
                        type="button"
                        className={styles.optionRemoveButton}
                        onClick={() => removeOption('snack', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.optionInputRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={newOption.snack}
                    onChange={(e) => setNewOption(prev => ({ ...prev, snack: e.target.value }))}
                    placeholder="Add a snack option"
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className={styles.optionAddButton}
                    onClick={() => addOption('snack')}
                    disabled={readOnly}
                  >
                    Add snack
                  </button>
                </div>
              </div>

              <div className={styles.optionSection}>
                <div className={styles.optionSectionHeader}>
                  <div>
                    <h4 className={styles.optionSectionTitle}>Allergens</h4>
                    <p className={styles.optionSectionSubtitle}>List allergens so passengers can avoid this meal if needed.</p>
                  </div>
                </div>

                <div className={styles.optionList}>
                  {form.allergens.map((option, index) => (
                    <div key={index} className={styles.optionItem}>
                      <span>{option}</span>
                      <button
                        type="button"
                        className={styles.optionRemoveButton}
                        onClick={() => removeOption('allergen', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.optionInputRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={newOption.allergen}
                    onChange={(e) => setNewOption(prev => ({ ...prev, allergen: e.target.value }))}
                    placeholder="Add an allergen"
                    disabled={readOnly}
                  />
                  <button
                    type="button"
                    className={styles.optionAddButton}
                    onClick={() => addOption('allergen')}
                    disabled={readOnly}
                  >
                    Add allergen
                  </button>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={readOnly || saving || uploading}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className={styles.spin} />
                      Saving...
                    </>
                  ) : editing ? (
                    'Update meal'
                  ) : (
                    'Add meal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
