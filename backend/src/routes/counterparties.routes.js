import { Router } from 'express'
import { list,create,update,remove } from '../controllers/counterparties.controller.js'

const r=Router(); 
r.get('/',list); 
r.post('/',create); 
r.put('/:id',update); 
r.delete('/:id',remove); 
export default r