import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Use proxy in development (localhost:3000 -> localhost:5000), or explicit URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

interface User {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: 'user' | 'admin') => Promise<boolean>
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const AuthProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('railconnect_token')
    const savedUser = localStorage.getItem('railconnect_user')

    if (token && savedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const userData: User = JSON.parse(savedUser)
      setUser(userData)
      // User is already logged in, no need to navigate away from the current page.
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, role: 'user' | 'admin'): Promise<boolean> => {
    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      console.log('Sending login request:', { email: normalizedEmail, role, passwordLength: password.length })
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { 
        email: normalizedEmail, 
        password, 
        role 
      })
      const { token, user: userData } = response.data

      localStorage.setItem('railconnect_token', token)
      localStorage.setItem('railconnect_user', JSON.stringify(userData))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      setLoading(false)
      if (userData.role === 'admin') {
        navigate('/admin-dashboard')
      } else {
        navigate('/user-dashboard')
      }
      return true
    } catch (error: any) {
      console.error('Login failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setLoading(false)
      return false
    }
  }

  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      console.log('Sending registration request:', { name, email: normalizedEmail, phone, passwordLength: password.length })
      const response = await axios.post(`${API_BASE_URL}/auth/register`, { 
        name, 
        email: normalizedEmail, 
        phone, 
        password 
      })
      const { token, user: userData } = response.data

      localStorage.setItem('railconnect_token', token)
      localStorage.setItem('railconnect_user', JSON.stringify(userData))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      setLoading(false)
      navigate('/user-dashboard')
      return true
    } catch (error: any) {
      console.error('Registration failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('railconnect_token')
    localStorage.removeItem('railconnect_user')
    navigate('/')
    delete axios.defaults.headers.common['Authorization']
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProviderWrapper>{children}</AuthProviderWrapper>
)
