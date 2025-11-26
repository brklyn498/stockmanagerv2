import { Router } from 'express'
import * as orderController from '../controllers/orderController'
import { validate } from '../middleware/validate'
import { authMiddleware } from '../middleware/auth'
import { createOrderSchema, updateOrderStatusSchema } from '../types/schemas'

const router = Router()

router.use(authMiddleware)

router.get('/', orderController.getOrders)
router.get('/:id', orderController.getOrder)
router.post('/', validate(createOrderSchema), orderController.createOrder)
router.put('/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus)
router.delete('/:id', orderController.deleteOrder)

export default router
