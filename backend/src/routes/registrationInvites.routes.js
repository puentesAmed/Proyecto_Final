import { Router } from 'express'
import { createInvite, deleteInvite, listInvites } from '../controllers/registrationInvites.controller.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const r = Router()

r.get('/', requireAuth, requireAdmin, listInvites)
r.post('/', requireAuth, requireAdmin, createInvite)
r.delete('/:id', requireAuth, requireAdmin, deleteInvite)

export default r
