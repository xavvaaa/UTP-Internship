/**
 * System Settings Controller
 * Handles system preferences, menu categories, and inventory configuration
 */
import { adminDb } from '../firebaseAdmin.js'

const SYSTEM_DOC_ID = 'system_config'
const SETTINGS_COLLECTION = 'system_settings'
const CATEGORIES_COLLECTION = 'menu_categories'
const INVENTORY_COLLECTION = 'inventory_config'

/**
 * GET /api/admin/settings
 * Get system settings
 */
export async function getSettings(req, res) {
  try {
    const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(SYSTEM_DOC_ID).get()

    if (doc.exists()) {
      res.json({
        success: true,
        settings: {
          id: doc.id,
          ...doc.data(),
        },
      })
    } else {
      res.json({
        success: true,
        settings: {
          id: SYSTEM_DOC_ID,
          currency: 'MYR',
          timeFormat: '24-hour',
          language: 'en',
        },
      })
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
}

/**
 * PUT /api/admin/settings
 * Update system settings
 */
export async function updateSettings(req, res) {
  try {
    const { currency, timeFormat, language } = req.body

    const settingsData = {
      updated_at: new Date().toISOString(),
    }

    if (currency) settingsData.currency = currency
    if (timeFormat && ['12-hour', '24-hour'].includes(timeFormat)) {
      settingsData.timeFormat = timeFormat
    }
    if (language) settingsData.language = language

    await adminDb
      .collection(SETTINGS_COLLECTION)
      .doc(SYSTEM_DOC_ID)
      .set(settingsData, { merge: true })

    const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(SYSTEM_DOC_ID).get()
    res.json({
      success: true,
      settings: {
        id: doc.id,
        ...doc.data(),
      },
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
}

/**
 * GET /api/admin/categories
 * Get all menu categories
 */
export async function getCategories(req, res) {
  try {
    const snapshot = await adminDb.collection(CATEGORIES_COLLECTION).get()
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    res.json({
      success: true,
      categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
}

/**
 * POST /api/admin/categories
 * Create menu category
 */
export async function createCategory(req, res) {
  try {
    const { name, description, icon, color } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Category name is required' })
    }

    const categoryData = {
      name: name.trim(),
      description: description || '',
      icon: icon || '📦',
      color: color || '#667eea',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const docRef = await adminDb.collection(CATEGORIES_COLLECTION).add(categoryData)
    const doc = await docRef.get()

    res.status(201).json({
      success: true,
      category: {
        id: doc.id,
        ...doc.data(),
      },
    })
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
}

/**
 * PUT /api/admin/categories/:categoryId
 * Update menu category
 */
export async function updateCategory(req, res) {
  try {
    const { categoryId } = req.params
    const { name, description, icon, color } = req.body

    if (!categoryId?.trim()) {
      return res.status(400).json({ error: 'Category ID is required' })
    }

    const categoryRef = adminDb.collection(CATEGORIES_COLLECTION).doc(categoryId)
    const categorySnap = await categoryRef.get()

    if (!categorySnap.exists()) {
      return res.status(404).json({ error: 'Category not found' })
    }

    const updateData = { updated_at: new Date().toISOString() }

    if (name?.trim()) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description
    if (icon) updateData.icon = icon
    if (color) updateData.color = color

    await categoryRef.update(updateData)

    const updatedSnap = await categoryRef.get()
    res.json({
      success: true,
      category: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    })
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
}

/**
 * DELETE /api/admin/categories/:categoryId
 * Delete menu category
 */
export async function deleteCategory(req, res) {
  try {
    const { categoryId } = req.params

    if (!categoryId?.trim()) {
      return res.status(400).json({ error: 'Category ID is required' })
    }

    const categoryRef = adminDb.collection(CATEGORIES_COLLECTION).doc(categoryId)
    const categorySnap = await categoryRef.get()

    if (!categorySnap.exists()) {
      return res.status(404).json({ error: 'Category not found' })
    }

    await categoryRef.delete()

    res.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
}

/**
 * GET /api/admin/inventory
 * Get inventory configuration
 */
export async function getInventorySettings(req, res) {
  try {
    const snapshot = await adminDb.collection(INVENTORY_COLLECTION).get()
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    res.json({
      success: true,
      items,
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
}

/**
 * POST /api/admin/inventory
 * Create inventory item configuration
 */
export async function createInventoryItem(req, res) {
  try {
    const { name, defaultStock, lowThreshold, category } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Item name is required' })
    }

    const itemData = {
      name: name.trim(),
      defaultStock: defaultStock || 100,
      lowThreshold: lowThreshold || 20,
      category: category || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const docRef = await adminDb.collection(INVENTORY_COLLECTION).add(itemData)
    const doc = await docRef.get()

    res.status(201).json({
      success: true,
      item: {
        id: doc.id,
        ...doc.data(),
      },
    })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    res.status(500).json({ error: 'Failed to create inventory item' })
  }
}

/**
 * PUT /api/admin/inventory/:itemId
 * Update inventory item configuration
 */
export async function updateInventoryItem(req, res) {
  try {
    const { itemId } = req.params
    const { name, defaultStock, lowThreshold, category } = req.body

    if (!itemId?.trim()) {
      return res.status(400).json({ error: 'Item ID is required' })
    }

    const itemRef = adminDb.collection(INVENTORY_COLLECTION).doc(itemId)
    const itemSnap = await itemRef.get()

    if (!itemSnap.exists()) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    const updateData = { updated_at: new Date().toISOString() }

    if (name?.trim()) updateData.name = name.trim()
    if (defaultStock !== undefined) updateData.defaultStock = parseInt(defaultStock, 10)
    if (lowThreshold !== undefined) updateData.lowThreshold = parseInt(lowThreshold, 10)
    if (category !== undefined) updateData.category = category

    await itemRef.update(updateData)

    const updatedSnap = await itemRef.get()
    res.json({
      success: true,
      item: {
        id: updatedSnap.id,
        ...updatedSnap.data(),
      },
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    res.status(500).json({ error: 'Failed to update inventory item' })
  }
}

/**
 * DELETE /api/admin/inventory/:itemId
 * Delete inventory item configuration
 */
export async function deleteInventoryItem(req, res) {
  try {
    const { itemId } = req.params

    if (!itemId?.trim()) {
      return res.status(400).json({ error: 'Item ID is required' })
    }

    const itemRef = adminDb.collection(INVENTORY_COLLECTION).doc(itemId)
    const itemSnap = await itemRef.get()

    if (!itemSnap.exists()) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    await itemRef.delete()

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    res.status(500).json({ error: 'Failed to delete inventory item' })
  }
}
