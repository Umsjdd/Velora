import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => localStorage.getItem('vestora_token'))
  const navigate = useNavigate()

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vestora_token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const userData = await api.get('/api/auth/me')
        setUser(userData)
      } catch (err) {
        localStorage.removeItem('vestora_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('vestora_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const data = await api.post('/api/auth/register', { name, email, password })
    localStorage.setItem('vestora_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('vestora_token')
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
