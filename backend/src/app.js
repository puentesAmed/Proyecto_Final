import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import env from './config/env.js'

import authRoutes from './routes/auth.routes.js'
import accountRoutes from './routes/accounts.routes.js'
import cashflowRoutes from './routes/cashflows.routes.js'
import miscRoutes from './routes/misc.routes.js'
import scenariosRoutes from './routes/scenarios.routes.js'
import reportsRoutes from './routes/reports.routes.js'
import counterpartiesRoutes from './routes/counterparties.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import registrationInvitesRoutes from './routes/registrationInvites.routes.js'

// ⚠️ crear app ANTES de usar cualquier middleware
const app = express()
app.set('trust proxy', 1)

const ORIGINS = env.CORS_ORIGINS
const JOTRINSA_ORIGIN_RE = /^https:\/\/([a-z0-9-]+\.)?jotrinsa\.com$/i

const isAllowed = (origin) => {
  if (!origin) return true;
  if (ORIGINS.includes(origin)) return true;
  if (JOTRINSA_ORIGIN_RE.test(origin)) return true;
  // permitir permalinks del sitio en Netlify:
  if (/--prevtesorejot\.netlify\.app$/.test(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, cb) => isAllowed(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.options('*', cors())

app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))
app.use(rateLimit({ windowMs: 60_000, max: 120 }))

app.get('/', (_req,res)=> res.send('AW Previsión Tesorería API'))
app.get('/health', (_req,res)=> res.json({ ok:true }))

app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/counterparties', counterpartiesRoutes)
app.use('/api/registration-invites', registrationInvitesRoutes)
app.use('/api/cashflows', cashflowRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/scenarios', scenariosRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api', miscRoutes)

// (opcional) 404 JSON
app.use((_req,res)=> res.status(404).json({ error: 'Not found' }))

export default app
