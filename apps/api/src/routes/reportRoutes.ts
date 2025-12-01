import { Router } from 'express';
import { getInventoryReport, getLowStockReport, getSalesReport } from '../controllers/reportController';
import { authMiddleware as authenticateToken } from '../middleware/auth';

const router = Router();

// router.use(authenticateToken); // Auth disabled for now to match other routes

router.get('/inventory', getInventoryReport);
router.get('/low-stock', getLowStockReport);
router.get('/sales', getSalesReport);

export default router;
