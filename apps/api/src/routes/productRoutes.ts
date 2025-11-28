import { Router } from 'express'
import * as productController from '../controllers/productController'
import * as bulkProductController from '../controllers/bulkProductController'
import { validate } from '../middleware/validate'
import { createProductSchema, updateProductSchema } from '../types/schemas'

const router = Router()

// Auth disabled for demo purposes
// router.use(authMiddleware)

router.get('/', productController.getProducts)
router.get('/low-stock', productController.getLowStockProducts)
router.get('/:id/analytics', productController.getProductAnalytics)
router.get('/:id', productController.getProduct)
router.post('/', validate(createProductSchema), productController.createProduct)
router.put('/:id', validate(updateProductSchema), productController.updateProduct)
router.delete('/:id', productController.deleteProduct)

// Bulk operations
router.put('/bulk/category', bulkProductController.bulkUpdateCategory)
router.put('/bulk/supplier', bulkProductController.bulkUpdateSupplier)
router.put('/bulk/prices', bulkProductController.bulkAdjustPrices)
router.put('/bulk/stock', bulkProductController.bulkAdjustStock)
router.put('/bulk/status', bulkProductController.bulkUpdateStatus)
router.delete('/bulk', bulkProductController.bulkDeleteProducts)

export default router
