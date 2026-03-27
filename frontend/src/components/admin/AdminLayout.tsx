import React, { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface AdminLayoutProps {
  children: ReactNode
}

const navItems = [
  { label: 'Dashboard', to: '/admin-dashboard' },
  { label: 'Analytics', to: '/admin-analytics' },
  { label: 'Bookings', to: '/admin-bookings' },
  { label: 'Users', to: '/admin-users' },
  { label: 'Trains', to: '/admin-trains' }
]

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <span className="text-gray-600">Loading admin session...</span>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-700">You do not have permission to view this page.</p>
          <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">RailConnect Admin</h2>
          <p className="text-sm text-gray-400 mt-2">{user.email}</p>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block py-2 px-4 rounded-lg transition-colors ${
                      isActive ? 'bg-white text-gray-900 font-semibold' : 'hover:bg-gray-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={logout}
          className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 bg-gray-100">{children}</main>
    </div>
  )
}

export default AdminLayout
