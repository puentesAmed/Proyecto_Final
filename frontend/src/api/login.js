import { api } from '@/lib/api.js'

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password })
  localStorage.setItem("token", res.data.token)
  return res.data
}
