import { Schema, model } from 'mongoose'
const schema = new Schema({
  alias: { type:String, unique:true, index:true },
  entity: String,
  currency: { type:String, default:'EUR' },
  openingBalance: { type:Number, default:0 },
  active: { type:Boolean, default:true }
}, { timestamps:true })
export default model('BankAccount', schema)
