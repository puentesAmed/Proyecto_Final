import { Router } from 'express'
import { list, create, update, remove, balance } from '../controllers/accounts.controller.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const r = Router()

r.use(requireAuth)

r.get('/', list)
r.get('/balance', balance)
r.post('/', requireAdmin, create)
r.patch('/:id', requireAdmin, update)
r.delete('/:id', requireAdmin, remove)

export default r
