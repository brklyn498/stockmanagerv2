import { Router } from 'express'
import * as dashboardController from '../controllers/dashboardController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/stats', dashboardController.getStats)
router.get('/low-stock', dashboardController.getLowStockAlerts)
router.get('/recent-movements', dashboardController.getRecentMovements)

export default router
