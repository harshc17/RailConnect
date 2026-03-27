import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdminBookingsPage from './pages/AdminBookingsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminTrainsPage from './pages/AdminTrainsPage'
import BookingDetailsPage from './pages/BookingDetailsPage'
import BookingPage from './pages/BookingPage'
import { AuthProvider } from './contexts/AuthContext'
import MyAccountLayout from './pages/MyAccountLayout'
import UpdateProfilePage from './pages/UpdateProfilePage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import MyTransactionsPage from './pages/MyTransactionsPage'
import MyBookingsPage from './pages/MyBookingsPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin-bookings" element={<AdminBookingsPage />} />
            <Route path="/admin-bookings/:id" element={<BookingDetailsPage />} />
            <Route path="/admin-users" element={<AdminUsersPage />} />
            <Route path="/admin-trains" element={<AdminTrainsPage />} />
            <Route path="/booking/:trainId" element={<BookingPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/my-account" element={<MyAccountLayout />}>
              <Route index element={<UpdateProfilePage />} />
              <Route path="profile" element={<UpdateProfilePage />} />
              <Route path="change-password" element={<ChangePasswordPage />} />
              <Route path="transactions" element={<MyTransactionsPage />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
