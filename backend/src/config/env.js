import 'dotenv/config'

['MONGO_URI', 'JWT_SECRET'].forEach(k => {
  if (!process.env[k]) {
    console.error(`❌ Falta la variable de entorno ${k}`)
    process.exit(1)
  }
})

const ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export default {
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGINS: ORIGINS,
  NODE_ENV: process.env.NODE_ENV ?? 'development'
}
