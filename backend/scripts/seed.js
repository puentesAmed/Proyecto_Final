import 'dotenv/config'
import fs from 'fs'
import { parse } from 'csv-parse/sync'
import { connectMongo } from '../src/config/mongo.js'
import User from '../src/models/User.js'
import BankAccount from '../src/models/BankAccount.js'
import Category from '../src/models/Category.js'
import Counterparty from '../src/models/Counterparty.js'
import Cashflow from '../src/models/Cashflow.js'
import bcrypt from 'bcrypt'

const readCsv = (p)=> parse(fs.readFileSync(p), { columns:true, skip_empty_lines:true })
await connectMongo(process.env.MONGO_URI)

await BankAccount.deleteMany({})
const accDocs = await BankAccount.insertMany(readCsv('data/bankAccounts.csv'))
const accByAlias = Object.fromEntries(accDocs.map(a=> [a.alias, a]))

await Category.deleteMany({})
const catDocs = await Category.insertMany(readCsv('data/categories.csv'))
const catByName = Object.fromEntries(catDocs.map(c=> [c.name, c]))

await Counterparty.deleteMany({})
const cpDocs = await Counterparty.insertMany(readCsv('data/counterparties.csv'))
const cpByNif = Object.fromEntries(cpDocs.map(c=> [c.nif, c]))

await Cashflow.deleteMany({})
for(const r of readCsv('data/cashflows.csv')){
  const account = accByAlias[r.accountAlias]?._id
  const category = catByName[r.categoryName]?._id
  const counterparty = cpByNif[r.counterpartyNif]?._id
  if(!account) continue
  await Cashflow.create({
    account, category, counterparty,
    date: new Date(r.date),
    amount: Number(r.amount),
    type: r.type, concept: r.concept,
    status: r.status || 'planned'
  })
}

await User.deleteMany({})
for(const u of readCsv('data/users.csv')){
  const passwordHash = await bcrypt.hash(u.password, 10)
  await User.create({ email:u.email, name:u.name, role:u.role || 'fin', passwordHash })
}

console.log('Seed OK'); process.exit(0)
