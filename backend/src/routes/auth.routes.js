import { Router } from 'express'
import { googleLogin } from '../controllers/auth.controller.js'

const authRouter = Router()

authRouter.post('/auth/google', googleLogin)

export default authRouter
