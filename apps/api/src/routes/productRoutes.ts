import { Router } from 'express'
import * as productController from '../controllers/productController'
import { validate } from '../middleware/validate'
import { createProductSchema, updateProductSchema } from '../types/schemas'

const router = Router()

// Auth disabled for demo purposes
// router.use(authMiddleware)

router.get('/', productController.getProducts)
router.get('/low-stock', productController.getLowStockProducts)
router.get('/:id', productController.getProduct)
router.post('/', validate(createProductSchema), productController.createProduct)
router.put('/:id', validate(updateProductSchema), productController.updateProduct)
router.delete('/:id', productController.deleteProduct)

export default router
