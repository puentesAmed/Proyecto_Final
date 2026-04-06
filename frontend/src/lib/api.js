import axios from 'axios'
import { useAuth } from '@/state/auth.js'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 300000,
})

api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }

  return cfg
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const { logout } = useAuth.getState()
      logout()
    }

    return Promise.reject(error)
  }
)
