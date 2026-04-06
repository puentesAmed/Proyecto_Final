import { Router } from 'express'

const r=Router(); 
r.get('/ping',(_req,res)=> res.json({pong:true})); 
export default r