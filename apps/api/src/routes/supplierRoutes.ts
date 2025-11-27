import { Router } from 'express'
import * as supplierController from '../controllers/supplierController'
import { validate } from '../middleware/validate'
import { createSupplierSchema, updateSupplierSchema } from '../types/schemas'

const router = Router()

// Auth disabled for demo purposes
// router.use(authMiddleware)

router.get('/', supplierController.getSuppliers)
router.get('/:id', supplierController.getSupplier)
router.post('/', validate(createSupplierSchema), supplierController.createSupplier)
router.put('/:id', validate(updateSupplierSchema), supplierController.updateSupplier)
router.delete('/:id', supplierController.deleteSupplier)

export default router
