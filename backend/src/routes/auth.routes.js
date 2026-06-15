import { Router } from 'express'
import { login, me, register, updateMe, updatePassword } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
const r = Router()
r.post('/register', register)
r.post('/login', login)
r.get('/me', requireAuth, me)
r.patch('/me', requireAuth, updateMe)
r.patch('/password', requireAuth, updatePassword)
export default r
