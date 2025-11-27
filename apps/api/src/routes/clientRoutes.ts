import { Router } from 'express'
import * as clientController from '../controllers/clientController'
import { validate } from '../middleware/validate'
import { createClientSchema, updateClientSchema } from '../types/schemas'

const router = Router()

// Auth disabled for demo purposes
// router.use(authMiddleware)

router.get('/', clientController.getClients)
router.get('/:id', clientController.getClient)
router.post('/', validate(createClientSchema), clientController.createClient)
router.put('/:id', validate(updateClientSchema), clientController.updateClient)
router.delete('/:id', clientController.deleteClient)

export default router
