import { Router } from 'express'
import * as categoryController from '../controllers/categoryController'
import { validate } from '../middleware/validate'
import { createCategorySchema, updateCategorySchema } from '../types/schemas'

const router = Router()

// Auth disabled for demo purposes
// router.use(authMiddleware)

router.get('/', categoryController.getCategories)
router.get('/:id', categoryController.getCategory)
router.post('/', validate(createCategorySchema), categoryController.createCategory)
router.put('/:id', validate(updateCategorySchema), categoryController.updateCategory)
router.delete('/:id', categoryController.deleteCategory)

export default router
