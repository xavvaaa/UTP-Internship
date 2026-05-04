import { Router } from 'express'
import { getFlightReport } from '../controllers/reportsController.js'
import { requireAdminForActiveFlight, requireAuth, requireAdmin } from '../middleware/authz.js'

const reportsRoutes = Router()

reportsRoutes.get('/reports/summary', requireAuth, requireAdmin, getFlightReport)

export default reportsRoutes
