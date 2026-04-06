import axios from "axios"

const API_URL = "http://localhost:3000/api/auth"


export const login = async (email, password) => {
  const res = await axios.post(`${API_URL}/login`, { email, password })
  localStorage.setItem("token", res.data.token) // Guardamos token
  return res.data
}
