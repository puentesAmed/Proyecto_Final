import Cashflow from '../models/Cashflow.js'
import BankTx from '../models/BankTx.js'
import BankAccount from '../models/BankAccount.js'

export async function buildForecast({ from, to, accounts=[], scenario='base' }){
  const start = new Date(from); const end = new Date(to)
  const accs = accounts.length ? await BankAccount.find({ _id:{ $in:accounts }}) : await BankAccount.find()
  const startBalance = Object.fromEntries(accs.map(a=> [a.id, a.openingBalance]))
  const txs = await BankTx.find({ date:{ $lt:start }}).lean()
  txs.forEach(t=> { startBalance[t.account] = (startBalance[t.account]||0) + t.amount })

  const cfs = await Cashflow.find({ date:{ $gte:start, $lte:end } }).lean()
  const adj = (cf)=>{ let amount = cf.amount; if(scenario==='stress' && cf.type==='out') amount*=1.1; if(scenario==='stress' && cf.type==='in') amount*=0.95; return { ...cf, amount } }
  const cfsAdj = cfs.map(adj)

  const days = []; const cur = new Date(start)
  const bal = { ...startBalance }
  while(cur <= end){
    const dayISO = cur.toISOString().slice(0,10)
    let total = 0
    for(const a of accs){
      const delta = cfsAdj
        .filter(cf => String(cf.account)===a.id && cf.date.toISOString().slice(0,10)===dayISO)
        .reduce((s,cf)=> s + (cf.type==='in'? cf.amount : -cf.amount), 0)
      bal[a.id] = (bal[a.id]||0) + delta
      total += bal[a.id]
    }
    days.push({ date: dayISO, total })
    cur.setDate(cur.getDate()+1)
  }
  const minBalance = Math.min(...days.map(d=> d.total))
  return { days, minBalance }
}
