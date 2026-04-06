import { buildForecast } from '../services/forecast.js'
export const forecast = async (req,res)=>{
  const { from, to, accounts, scenario } = req.query
  const data = await buildForecast({ from, to, accounts: (accounts||'').split(',').filter(Boolean), scenario })
  res.json(data)
}
