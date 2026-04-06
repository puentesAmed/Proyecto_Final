import Counterparty from '../models/Counterparty.js'


export const list=async(_req,res)=> res.json(await Counterparty.find().lean())
export const create=async(req,res)=> res.status(201).json(await Counterparty.create(req.body))
export const update=async(req,res)=>{ const doc=await Counterparty.findByIdAndUpdate(req.params.id,req.body,{new:true}); 
    if(!doc) 
        returnres.status(404).json({error:'not_found'}); 
    res.json(doc) 
}
export const remove=async(req,res)=>{ await Counterparty.findByIdAndDelete(req.params.id);
res.status(204).end() }