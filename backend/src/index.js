import { createServer } from 'http'
import app from './app.js'
import { connectMongo } from './config/mongo.js'
import env from './config/env.js'
import reportsRoutes from './routes/reports.routes.js'
import Cashflow from './models/Cashflow.js'

process.on('unhandledRejection', r => console.error(r))
process.on('uncaughtException', e => console.error(e))

app.get('/health', (_req,res)=>res.status(200).send('ok'))

await connectMongo(env.MONGO_URI).catch(err => {
  console.error('Mongo no conectó:', err.message)
  // NO salgas del proceso; el conector reintentará
})

try {
  await Cashflow.syncIndexes()
} catch (e) {
  console.warn('No se pudo syncIndexes:', e.message)
}

app.use('/api/reports', reportsRoutes)

createServer(app).listen(env.PORT, '0.0.0.0', () =>
  console.log(`API ${env.PORT}`)
)
