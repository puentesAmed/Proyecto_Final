import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export function requireAuth(req, res, next) {
  const authorizationHeader = req.headers.authorization || ''
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null

  if (!token) {
    return res.status(401).json({ message: 'Sesión no autorizada' })
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ message: 'Sesión expirada o token inválido' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'No tienes permisos para esta acción' })
  }

  return next()
}
