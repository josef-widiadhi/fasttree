import axios from 'axios'

// In production (served by nginx), API calls go to same origin via nginx proxy.
// In local dev (vite dev server), vite.config.js proxy handles /api -> localhost:8000.
// Either way, baseURL stays empty — always use relative /api paths.
const api = axios.create({
  baseURL: '',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
