import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export function auth(req,res,next){
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if(!token) return res.status(401).json({ error:'unauthorized' })
  try{ req.user = jwt.verify(token, env.JWT_SECRET); next() }
  catch{ res.status(401).json({ error:'invalid_token' }) }
}
export const roles = (...allowed)=> (req,res,next)=>{
  if(!req.user || !allowed.includes(req.user.role)) return res.status(403).json({ error:'forbidden' })
  next()
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}
