import { Router } from 'express'
import * as authController from '../controllers/authController'
import { validate } from '../middleware/validate'
import { authMiddleware } from '../middleware/auth'
import { registerSchema, loginSchema } from '../types/schemas'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/refresh', authController.refresh)
router.get('/me', authMiddleware, authController.me)

export default router
