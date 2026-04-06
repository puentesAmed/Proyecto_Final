import { Router } from 'express'
import { list, create, update, remove, balance } from '../controllers/accounts.controller.js'

const r = Router()
r.get('/', list)
r.post('/', create)
r.patch('/:id', update)
r.delete('/:id', remove)
r.get('/balance', balance)

export default r
