import mongoose from 'mongoose'
import env from '../src/config/env.js'
import Account from '../src/models/Account.js'
import Counterparties from '../src/models/Counterparty.js'
import Categories from '../src/models/Category.js'
import Cashflow from '../src/models/Cashflow.js'


await mongoose.connect(env.MONGO_URI)
await
Promise.all([Cashflow.deleteMany(),Account.deleteMany(),Counterparty.deleteMany(),Category.deleteMany()])
const acc1=await Account.create({ alias:'Cuenta 001', bank:'Banco A', initialBalance:5000 })
const acc2=await Account.create({ alias:'Cuenta 002', bank:'Banco B', initialBalance:12000 })
const prov1=await Counterparties.create({ name:'Proveedor A' })
const prov2=await Counterparties.create({ name:'Proveedor B' })
const cat1=await Categories.create({ name:'Servicios' })
const cat2=await Categories.create({ name:'Ventas' })
const base=new Date()

for(let i=0;i<100;i++){ const d=new Date(base); d.setDate(d.getDate()+i-50); const isIn=Math.random()>0.6;
const amount=Number((Math.random()*2000+50).toFixed(2))*(isIn?1:-1)
    await Cashflow.create({ date:d, account: Math.random()>0.5?acc1._id:acc2._id, counterparties:
    Math.random()>0.5?prov1._id:prov2._id, amount, type:isIn?'in':'out', categories:
    Math.random()>0.5?cat1._id:cat2._id, concept:`Vto ${i}` })
}
console.log('Seed OK'); process.exit(0)