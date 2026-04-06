import { Router } from 'express'
import { list,create,update,remove } from '../controllers/scenarios.controller.js'

const r=Router(); 
r.get('/',list); 
r.post('/',create); 
r.put('/:id',update); 
r.delete('/:id',remove); 
export default r