import { Router } from 'express'
import { createOrder, updateOrderStatus } from '../controllers/orderController.js'
import { requireAuth } from '../middleware/authz.js'

const orderRoutes = Router()

orderRoutes.post('/order', createOrder)
orderRoutes.patch('/orders/:orderId/status', requireAuth, updateOrderStatus)

export default orderRoutes
