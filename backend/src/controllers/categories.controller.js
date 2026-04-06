import Category from '../models/Category.js'

export const list=async(_req,res)=> res.json(await Category.find().lean())
export const create=async(req,res)=> res.status(201).json(await Category.create(req.body))
export const update=async(req,res)=>{ const doc=await Category.findByIdAndUpdate(req.params.id,req.body,{new:true}); 
    if(!doc) 
        return res.status(404).json({error:'not_found'}); 
    res.json(doc) 
}
export const remove=async(req,res)=>{ await Category.findByIdAndDelete(req.params.id); res.status(204).end() }