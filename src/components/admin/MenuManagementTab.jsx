import { useMemo, useState } from 'react'
import { Check, CheckCircle2, Loader2, Pencil, Trash2, Upload, Plus, AlertTriangle, X } from 'lucide-react'
import { useToast } from '../../context/useToast'
import styles from './MenuManagementTab.module.css'

const PREDEFINED_DRINKS = [
  'Sparkling Water',
  'Coffee',
  'Tea',
  'Orange Juice',
  'Apple Juice',
  'Cola',
  'Diet Cola',
  'Sprite',
]

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
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortMode, setSortMode] = useState('name')
  const [activeOptionTab, setActiveOptionTab] = useState('drink')
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
  const optionTabs = [
    {
      id: 'drink',
      title: 'Drinks',
      subtitle: 'Add drinks passengers can choose with this meal.',
      placeholder: 'Add a drink option',
      buttonLabel: 'Add drink',
      options: form.drinkOptions,
    },
    {
      id: 'dessert',
      title: 'Desserts',
      subtitle: 'Add desserts passengers can choose with this meal.',
      placeholder: 'Add a dessert option',
      buttonLabel: 'Add dessert',
      options: form.dessertOptions,
    },
    {
      id: 'snack',
      title: 'Snacks',
      subtitle: 'Add snacks passengers can choose with this meal.',
      placeholder: 'Add a snack option',
      buttonLabel: 'Add snack',
      options: form.snackOptions,
    },
    {
      id: 'allergen',
      title: 'Allergens',
      subtitle: 'List allergens so passengers can avoid this meal if needed.',
      placeholder: 'Add an allergen',
      buttonLabel: 'Add allergen',
      options: form.allergens,
    },
  ]
  const activeOption = optionTabs.find((tab) => tab.id === activeOptionTab) || optionTabs[0]

  const menuStats = useMemo(() => {
    const initial = { total: meals.length, available: 0, low: 0, out: 0, totalStock: 0 }
    return meals.reduce((acc, item) => {
      const stock = Number(item.stock || 0)
      const stockStatus = getStockStatus(stock, item.lowStockThreshold || 20)
      acc.totalStock += stock
      if (stockStatus.status === 'available') acc.available += 1
      if (stockStatus.status === 'low') acc.low += 1
      if (stockStatus.status === 'out') acc.out += 1
      return acc
    }, initial)
  }, [meals])

  const visibleMeals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return meals
      .filter((item) => {
        const stockStatus = getStockStatus(item.stock || 0, item.lowStockThreshold || 20)
        if (stockFilter !== 'all' && stockStatus.status !== stockFilter) return false
        if (!query) return true
        return [
          item.name,
          item.description,
          ...(item.drinkOptions || []),
          ...(item.dessertOptions || []),
          ...(item.snackOptions || []),
          ...(item.allergens || []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => {
        if (sortMode === 'stock-low') return Number(a.stock || 0) - Number(b.stock || 0)
        if (sortMode === 'stock-high') return Number(b.stock || 0) - Number(a.stock || 0)
        return String(a.name).localeCompare(String(b.name))
      })
  }, [meals, searchQuery, sortMode, stockFilter])

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
    setActiveOptionTab('drink')
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
    setActiveOptionTab('drink')
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
    
    setForm((prev) => {
      const options = currentArray(prev)
      const alreadyAdded = options.some(
        (option) => String(option).trim().toLowerCase() === draft.toLowerCase(),
      )
      if (alreadyAdded) return prev

      return {
        ...prev,
        [propertyKey]: [...options, draft],
      }
    })
    setNewOption((prev) => ({ ...prev, [type]: '' }))
  }

  function togglePredefinedDrink(drink) {
    setForm((prev) => {
      const options = Array.isArray(prev.drinkOptions) ? prev.drinkOptions : []
      const selectedIndex = options.findIndex(
        (option) => String(option).trim().toLowerCase() === drink.toLowerCase(),
      )

      return {
        ...prev,
        drinkOptions:
          selectedIndex >= 0
            ? options.filter((_, index) => index !== selectedIndex)
            : [...options, drink],
      }
    })
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
      <div className={styles.summaryGrid} aria-label="Menu summary">
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{menuStats.total}</span>
          <span className={styles.summaryLabel}>Meals</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.availableSummary}`}>
          <span className={styles.summaryValue}>{menuStats.available}</span>
          <span className={styles.summaryLabel}>Available</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.lowSummary}`}>
          <span className={styles.summaryValue}>{menuStats.low}</span>
          <span className={styles.summaryLabel}>Low stock</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.outSummary}`}>
          <span className={styles.summaryValue}>{menuStats.out}</span>
          <span className={styles.summaryLabel}>Out</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{menuStats.totalStock}</span>
          <span className={styles.summaryLabel}>Total Stock</span>
        </div>
      </div>

      <div className={styles.controls} aria-label="Menu list controls">
        <label className={styles.searchControl}>
          <span>Find</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Meal, option, allergen"
          />
        </label>
        <label className={styles.filterControl}>
          <span>Stock</span>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
            <option value="all">All stock</option>
            <option value="available">Available</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </label>
        <label className={styles.filterControl}>
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="name">Name</option>
            <option value="stock-low">Stock: low first</option>
            <option value="stock-high">Stock: high first</option>
          </select>
        </label>
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
        ) : visibleMeals.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No meals match the current filters.</p>
            <button
              type="button"
              className={styles.emptyAction}
              onClick={() => {
                setSearchQuery('')
                setStockFilter('all')
                setSortMode('name')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          visibleMeals.map((item) => (
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
                <X size={18} />
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.mealIdentity} data-span="full">
                  <label className={styles.imageField}>
                    <span className={styles.identityLabel}>Meal image</span>
                    <div
                      className={`${styles.imagePicker} ${form.imageUrl ? styles.hasImage : ''}`}
                    >
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="Meal preview" />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <Upload size={22} />
                          <span>Add image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={readOnly || uploading}
                        className={styles.fileInput}
                        aria-label="Choose meal image"
                      />
                      {form.imageUrl && !readOnly && (
                        <span className={styles.changeImage}>
                          <Upload size={14} />
                          {uploading ? 'Uploading...' : 'Change'}
                        </span>
                      )}
                    </div>
                    {uploading && !form.imageUrl && (
                      <span className={styles.uploadStatus}>Uploading...</span>
                    )}
                  </label>

                  <div className={styles.identityDetails}>
                    <div className={styles.identityControls}>
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

                      <label className={styles.compactColorField}>
                        <span>Meal color</span>
                        <div className={styles.compactColorControl}>
                          <span
                            className={styles.colorSwatch}
                            style={{ backgroundColor: form.color || '#3b82f6' }}
                            aria-hidden="true"
                          />
                          <input
                            type="color"
                            className={styles.compactColorPicker}
                            value={form.color || '#3b82f6'}
                            onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                            disabled={readOnly}
                            aria-label="Choose meal color"
                          />
                          <input
                            type="text"
                            className={styles.compactColorInput}
                            value={form.color || '#3b82f6'}
                            onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                            placeholder="#3b82f6"
                            disabled={readOnly}
                            pattern="^#[0-9A-Fa-f]{6}$"
                            aria-label="Meal color hex value"
                          />
                        </div>
                      </label>
                    </div>
                    <p className={styles.identityHint}>
                      The color is used as a quick visual identifier across the menu.
                    </p>
                  </div>
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

                {/* Stock Management Fields */}
                <div className={styles.stockGrid} data-span="full">
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
                      <small className={styles.fieldHint}>Current available quantity</small>
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
                      <small className={styles.fieldHint}>Alert when stock drops below this level</small>
                    </label>
                  </div>
                </div>
              </div>

              {/* Options Tabs */}
              <div className={styles.optionTabs}>
                <div className={styles.tabButtons}>
                  {optionTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`${styles.tabButton} ${activeOptionTab === tab.id ? styles.active : ''}`}
                      onClick={() => setActiveOptionTab(tab.id)}
                    >
                      {tab.title}
                    </button>
                  ))}
                </div>

                <div className={styles.tabContent}>
                  <div className={styles.optionSectionHeader}>
                    <div>
                      <h4 className={styles.optionSectionTitle}>{activeOption.title}</h4>
                      <p className={styles.optionSectionSubtitle}>{activeOption.subtitle}</p>
                    </div>
                    <span className={styles.selectedCount}>
                      {activeOption.options.length} selected
                    </span>
                  </div>

                  {activeOptionTab === 'drink' && (
                    <div className={styles.presetSection}>
                      <div className={styles.presetHeading}>
                        <span>Quick select</span>
                        <small>Choose one or more common drinks.</small>
                      </div>
                      <div className={styles.presetGrid}>
                        {PREDEFINED_DRINKS.map((drink) => {
                          const selected = form.drinkOptions.some(
                            (option) =>
                              String(option).trim().toLowerCase() === drink.toLowerCase(),
                          )

                          return (
                            <button
                              key={drink}
                              type="button"
                              className={`${styles.presetOption} ${selected ? styles.presetSelected : ''}`}
                              aria-pressed={selected}
                              onClick={() => togglePredefinedDrink(drink)}
                              disabled={readOnly}
                            >
                              <span className={styles.presetCheck} aria-hidden="true">
                                {selected ? <Check size={14} /> : null}
                              </span>
                              {drink}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.optionList}>
                    {activeOption.options.map((option, index) => (
                      <div key={`${option}-${index}`} className={styles.optionItem}>
                        <span>{option}</span>
                        <button
                          type="button"
                          className={styles.optionRemoveButton}
                          onClick={() => removeOption(activeOptionTab, index)}
                          aria-label={`Remove ${option}`}
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
                      value={newOption[activeOptionTab]}
                      onChange={(e) => setNewOption(prev => ({ ...prev, [activeOptionTab]: e.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addOption(activeOptionTab)
                        }
                      }}
                      placeholder={activeOption.placeholder}
                      disabled={readOnly}
                    />
                    <button
                      type="button"
                      className={styles.optionAddButton}
                      onClick={() => addOption(activeOptionTab)}
                      disabled={readOnly}
                    >
                      {activeOption.buttonLabel}
                    </button>
                  </div>
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
