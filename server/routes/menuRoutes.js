import { Router } from 'express'
import {
  createMenuMeal,
  listMenu,
  removeMenuMeal,
  updateMenuMeal,
} from '../controllers/menuController.js'
import { requireAuth, requireFlightClaim, requireAdmin, requireAdminOrFlightClaim } from '../middleware/authz.js'

const menuRoutes = Router()

menuRoutes.get('/menu', listMenu)
menuRoutes.post('/menu', requireAuth, requireAdminOrFlightClaim, createMenuMeal)
menuRoutes.put('/menu/:mealId', requireAuth, requireAdminOrFlightClaim, updateMenuMeal)
menuRoutes.delete('/menu/:mealId', requireAuth, requireAdminOrFlightClaim, removeMenuMeal)

export default menuRoutes
