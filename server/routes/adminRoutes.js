/**
 * Admin Management Routes
 * User management, settings, categories, and inventory endpoints
 */
import { Router } from 'express'
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  toggleUserStatus,
  updateUserClaims,
} from '../controllers/userController.js'
import {
  getSettings,
  updateSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getInventorySettings,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../controllers/settingsController.js'
import { requireAuth, requireAdminForActiveFlight, requireAdmin } from '../middleware/authz.js'

const adminRoutes = Router()

// User Management Routes (Admin only)
adminRoutes.get('/admin/users', requireAuth, requireAdmin, getAllUsers)
adminRoutes.post('/admin/users', requireAuth, requireAdmin, createUser)
adminRoutes.put('/admin/users/:userId', requireAuth, requireAdmin, updateUser)
adminRoutes.delete('/admin/users/:userId', requireAuth, requireAdmin, deleteUser)
adminRoutes.put('/admin/users/:userId/role', requireAuth, requireAdmin, updateUserRole)
adminRoutes.put('/admin/users/:userId/activate', requireAuth, requireAdmin, toggleUserStatus)
adminRoutes.post('/admin/update-claims', requireAuth, requireAdminForActiveFlight, updateUserClaims)

// System Settings Routes (Admin only)
adminRoutes.get('/admin/settings', requireAuth, requireAdmin, getSettings)
adminRoutes.put('/admin/settings', requireAuth, requireAdmin, updateSettings)

// Menu Categories Routes (Admin only)
adminRoutes.get('/admin/categories', requireAuth, requireAdminForActiveFlight, getCategories)
adminRoutes.post('/admin/categories', requireAuth, requireAdminForActiveFlight, createCategory)
adminRoutes.put('/admin/categories/:categoryId', requireAuth, requireAdminForActiveFlight, updateCategory)
adminRoutes.delete('/admin/categories/:categoryId', requireAuth, requireAdminForActiveFlight, deleteCategory)

// Inventory Settings Routes (Admin only)
adminRoutes.get('/admin/inventory', requireAuth, requireAdmin, getInventorySettings)
adminRoutes.post('/admin/inventory', requireAuth, requireAdmin, createInventoryItem)
adminRoutes.put('/admin/inventory/:itemId', requireAuth, requireAdmin, updateInventoryItem)
adminRoutes.delete('/admin/inventory/:itemId', requireAuth, requireAdmin, deleteInventoryItem)

export default adminRoutes
