import { Router } from 'express'
import * as stockMovementController from '../controllers/stockMovementController'
import { validate } from '../middleware/validate'
import { createStockMovementSchema } from '../types/schemas'

const router = Router()

// Auth disabled for demo purposes
// router.use(authMiddleware)

router.get('/', stockMovementController.getStockMovements)
router.post(
  '/',
  validate(createStockMovementSchema),
  stockMovementController.createStockMovement
)

export default router
