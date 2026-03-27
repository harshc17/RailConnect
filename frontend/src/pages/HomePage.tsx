import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Train, Clock, User, Shield, HelpCircle, Bell, Menu, X } from 'lucide-react'
import { format } from 'date-fns'
import LoginModal from '../components/LoginModal'
import RegisterModal from '../components/RegisterModal'
import { useAuth } from '../contexts/AuthContext'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLoginClick = (type: 'user' | 'admin') => {
    setLoginType(type)
    setShowLoginModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="irctc-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded-lg">
                <Train className="h-6 w-6 text-irctc-primary" />
              </div>
              <span className="text-xl font-bold">RailConnect</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => handleLoginClick('user')}
                className="flex items-center space-x-1 hover:text-irctc-light transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center space-x-1 hover:text-irctc-light transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Register</span>
              </button>
              <button
                onClick={() => handleLoginClick('admin')}
                className="flex items-center space-x-1 hover:text-irctc-light transition-colors"
              >
                <Shield className="h-4 w-4" />
                <span>Admin Login</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-irctc-light transition-colors">
                <HelpCircle className="h-4 w-4" />
                <span>Help & Support</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-irctc-light transition-colors">
                <Bell className="h-4 w-4" />
                <span>Alerts</span>
              </button>
            </nav>

            {/* Time Display */}
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{format(currentTime, 'dd MMM yyyy, HH:mm:ss')}</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-irctc-accent"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-irctc-accent">
              <div className="space-y-2">
                <button
                  onClick={() => handleLoginClick('user')}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 hover:bg-irctc-accent rounded-md"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 hover:bg-irctc-accent rounded-md"
                >
                  <User className="h-4 w-4" />
                  <span>Register</span>
                </button>
                <button
                  onClick={() => handleLoginClick('admin')}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 hover:bg-irctc-accent rounded-md"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Login</span>
                </button>
                <button className="flex items-center space-x-2 w-full text-left px-3 py-2 hover:bg-irctc-accent rounded-md">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help & Support</span>
                </button>
                <button className="flex items-center space-x-2 w-full text-left px-3 py-2 hover:bg-irctc-accent rounded-md">
                  <Bell className="h-4 w-4" />
                  <span>Alerts</span>
                </button>
                <div className="flex items-center space-x-2 px-3 py-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{format(currentTime, 'dd MMM yyyy, HH:mm:ss')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Login/Register Card */}
          <div className="order-2 lg:order-1">
            <div className="booking-card max-w-md mx-auto lg:mx-0">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to RailConnect</h2>
                <p className="text-gray-600">Please login to book your train tickets</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleLoginClick('user')}
                  className="w-full btn-primary text-lg py-4"
                >
                  <User className="inline h-5 w-5 mr-2" />
                  User Login
                </button>

                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full btn-secondary text-lg py-4"
                >
                  <User className="inline h-5 w-5 mr-2" />
                  New User Registration
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <button
                  onClick={() => handleLoginClick('admin')}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200"
                >
                  <Shield className="inline h-5 w-5 mr-2" />
                  Admin Login
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Section with Train Image */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="bg-gradient-to-br from-irctc-primary to-irctc-accent rounded-2xl p-8 text-white">
                <div className="text-center">
                  <Train className="h-32 w-32 mx-auto mb-6 animate-pulse-slow" />
                  <h1 className="text-4xl font-bold mb-4">Book Your Journey</h1>
                  <p className="text-xl mb-6 text-irctc-light">
                    India's most trusted train reservation platform
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">200+</div>
                      <div className="text-sm text-irctc-light">Stations</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">1000+</div>
                      <div className="text-sm text-irctc-light">Trains</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm text-irctc-light">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose RailConnect?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-irctc-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Train className="h-8 w-8 text-irctc-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Booking</h3>
              <p className="text-gray-600">Book tickets instantly with live seat availability</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-irctc-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-irctc-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">Safe and secure payment processing</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-irctc-light p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-irctc-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round the clock customer support</p>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          loginType={loginType}
          onSuccess={() => {
            setShowLoginModal(false)
            navigate(loginType === 'admin' ? '/admin-dashboard' : '/user-dashboard')
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false)
            navigate('/user-dashboard')
          }}
        />
      )}
    </div>
  )
}

export default HomePage
