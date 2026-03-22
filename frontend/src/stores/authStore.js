import { create } from 'zustand'
import api from '../utils/api'
import toast from 'react-hot-toast'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return true
    } catch (e) {
      set({ loading: false })
      toast.error(e.response?.data?.detail || 'Login failed')
      return false
    }
  },

  register: async (email, username, password, full_name) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/api/auth/register', { email, username, password, full_name })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return true
    } catch (e) {
      set({ loading: false })
      toast.error(e.response?.data?.detail || 'Registration failed')
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))
