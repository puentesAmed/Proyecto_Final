import Scenario from '../models/Scenario.js'

export const list=async(_req,res)=> res.json(await Scenario.find().sort({createdAt:-1}).lean())
export const create=async(req,res)=> res.status(201).json(await Scenario.create(req.body))
export const update=async(req,res)=>{ const doc=await Scenario.findByIdAndUpdate(req.params.id,req.body,{new:true}); 
if(!doc) 
    return res.status(404).json({error:'not_found'}); 
res.json(doc) 
}
export const remove=async(req,res)=>{ await Scenario.findByIdAndDelete(req.params.id); res.status(204).end() }