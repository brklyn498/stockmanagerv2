import { Router } from 'express'
import * as stockMovementController from '../controllers/stockMovementController'
import { validate } from '../middleware/validate'
import { authMiddleware } from '../middleware/auth'
import { createStockMovementSchema } from '../types/schemas'

const router = Router()

router.use(authMiddleware)

router.get('/', stockMovementController.getStockMovements)
router.post(
  '/',
  validate(createStockMovementSchema),
  stockMovementController.createStockMovement
)

export default router
