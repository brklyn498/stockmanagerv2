import { Router } from 'express'
import * as orderController from '../controllers/orderController'
import { validate } from '../middleware/validate'
import { createOrderSchema, updateOrderStatusSchema } from '../types/schemas'

const router = Router()

// Auth disabled for demo purposes
// router.use(authMiddleware)

router.get('/', orderController.getOrders)
router.get('/:id', orderController.getOrder)
router.post('/', validate(createOrderSchema), orderController.createOrder)
router.put('/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus)
router.delete('/:id', orderController.deleteOrder)

export default router
