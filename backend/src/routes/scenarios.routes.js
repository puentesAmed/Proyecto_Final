import { Router } from 'express'
import { list,create,update,remove } from '../controllers/scenarios.controller.js'
import { requireAuth } from '../middleware/auth.js'

const r=Router(); 
r.use(requireAuth)

r.get('/',list); 
r.post('/',create); 
r.put('/:id',update); 
r.delete('/:id',remove); 
export default r
