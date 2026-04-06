import mongoose from 'mongoose'

const S=new mongoose.Schema({ 
  name:{type:String,required:true}, 
  growth:{type:String,default:'0%'}
},{timestamps:true})

export default mongoose.model('Scenario', S)