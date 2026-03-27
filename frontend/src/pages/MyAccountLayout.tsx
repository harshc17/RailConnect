import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { User, Lock, CreditCard, LogOut, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

// Use proxy in development (localhost:3000 -> localhost:5000), or explicit URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

const MyAccountLayout: React.FC = () => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    const confirmMessage = `⚠️ WARNING: Account Deletion\n\nAre you absolutely sure you want to delete your account?\n\nThis action is IRREVERSIBLE and will:\n• Delete all your bookings\n• Delete all your transaction history\n• Cancel any active bookings\n• Permanently remove your account\n\nThis cannot be undone!`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('railconnect_token')
      if (!token) {
        alert('Please login to delete your account')
        setIsDeleting(false)
        return
      }

      console.log('Attempting to delete account, API URL:', `${API_BASE_URL}/auth/account`)

      const response = await axios.delete(`${API_BASE_URL}/auth/account`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10 second timeout
      })

      console.log('Delete account response:', response.data)

      // Logout immediately (clears token and user state)
      logout()
      
      // Show success message after logout
      alert('Your account has been deleted successfully.')
      
      // Navigate to home
      navigate('/')
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      })
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        alert('Cannot connect to the server. Please ensure the backend server is running on port 5000.\n\nTo start the server, run: cd server && npm run dev')
      } else if (error.response?.status === 403) {
        alert('Admin accounts cannot be deleted.')
      } else if (error.response?.status === 401) {
        alert('Your session has expired. Please login again.')
        logout()
        navigate('/')
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete account. Please try again.'
        alert(`Error: ${errorMessage}`)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const navLinks = [
    { to: '/my-account/profile', text: 'Update Profile', icon: User },
    { to: '/my-account/change-password', text: 'Change Password', icon: Lock },
    { to: '/my-account/transactions', text: 'My Transactions', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/user-dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">My Account</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="card p-4">
              <nav className="space-y-1">
                {navLinks.map(link => {
                  const Icon = link.icon
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          isActive ? 'bg-irctc-light text-irctc-primary' : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span>{link.text}</span>
                    </NavLink>
                  )
                })}
                <div className="border-t my-2"></div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || user?.role === 'admin'}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 ${
                    isDeleting || user?.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title={user?.role === 'admin' ? 'Admin accounts cannot be deleted' : ''}
                >
                  <Trash2 className="h-5 w-5 mr-3" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                </button>
              </nav>
            </div>
          </aside>
          <div className="lg:col-span-3">
            <div className="card">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MyAccountLayout