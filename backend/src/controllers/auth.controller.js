import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import RegistrationInvite from '../models/RegistrationInvite.js'
import env from '../config/env.js'
import User from '../models/User.js'
import { hashCode, normalizeEmail } from './registrationInvites.controller.js'

function signUserToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: '12h' }
  )
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  }
}

export async function register(req, res) {
  const { email, password, name, inviteCode } = req.body

  if (!email || !password || !name || !inviteCode) {
    return res.status(400).json({ error: 'email, password, name e inviteCode son obligatorios' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'password debe tener al menos 6 caracteres' })
  }

  const normalizedEmail = normalizeEmail(email)
  const cleanName = String(name).trim()
  const normalizedInviteCode = String(inviteCode).trim().toUpperCase()

  const existing = await User.findOne({ email: normalizedEmail }).lean()
  if (existing) {
    return res.status(409).json({ error: 'email ya registrado' })
  }

  const invite = await RegistrationInvite.findOne({
    email: normalizedEmail,
    codeHash: hashCode(normalizedInviteCode),
    usedAt: null,
  })

  if (!invite) {
    return res.status(403).json({ error: 'código de invitación no válido' })
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return res.status(403).json({ error: 'la invitación ha caducado' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    name: cleanName,
    role: invite.role,
  })

  invite.usedAt = new Date()
  await invite.save()

  const token = signUserToken(user)
  res.status(201).json({ token, user: sanitizeUser(user) })
}

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son obligatorios' })
  }

  const normalizedEmail = normalizeEmail(email)
  const user = await User.findOne({ email: normalizedEmail })

  if (!user) return res.status(401).json({ error: 'invalid' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'invalid' })

  const token = signUserToken(user)
  res.json({ token, user: sanitizeUser(user) })
}
