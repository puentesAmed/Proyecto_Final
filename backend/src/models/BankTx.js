import { Schema, model, Types } from 'mongoose'
const schema = new Schema({
  account: { type:Types.ObjectId, ref:'BankAccount', index:true },
  date: { type:Date, index:true },
  amount: Number,
  concept: String,
  fitId: { type:String, unique:true, sparse:true },
  matchedCashflow: { type:Types.ObjectId, ref:'Cashflow' }
}, { timestamps:true })
export default model('BankTx', schema)
