import React from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import DashboardStats from '../components/admin/DashboardStats'

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <DashboardStats />
    </AdminLayout>
  )
}

export default AdminDashboard