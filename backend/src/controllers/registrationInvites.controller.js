import crypto from 'crypto'
import RegistrationInvite from '../models/RegistrationInvite.js'

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()
const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex')
const generateCode = () => crypto.randomBytes(4).toString('hex').toUpperCase()

export async function listInvites(_req, res) {
  const items = await RegistrationInvite.find()
    .sort({ createdAt: -1 })
    .select('email role expiresAt usedAt createdAt')
    .lean()

  res.json(items)
}

export async function createInvite(req, res) {
  const { email, role = 'fin', expiresInDays = 7 } = req.body
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'email es obligatorio' })
  }

  if (!['admin', 'fin', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'role inválido' })
  }

  const code = generateCode()
  const expiresAt = expiresInDays
    ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
    : null

  const invite = await RegistrationInvite.create({
    email: normalizedEmail,
    codeHash: hashCode(code),
    role,
    createdBy: req.user?.sub || null,
    expiresAt,
  })

  res.status(201).json({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    code,
  })
}

export async function deleteInvite(req, res) {
  const { id } = req.params
  const deleted = await RegistrationInvite.findByIdAndDelete(id)

  if (!deleted) {
    return res.status(404).json({ error: 'invitación no encontrada' })
  }

  res.status(204).end()
}

export { hashCode, normalizeEmail }
