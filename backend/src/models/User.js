import { Schema, model } from 'mongoose'
const schema = new Schema({
  email: { type:String, unique:true, index:true },
  passwordHash: String,
  role: { type:String, enum:['admin','fin','viewer'], default:'fin' },
  name: String
}, { timestamps:true })
export default model('User', schema)
