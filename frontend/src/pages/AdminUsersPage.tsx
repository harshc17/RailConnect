import React from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import UserManagement from '../components/admin/UserManagement'

const AdminUsersPage: React.FC = () => {
  return (
    <AdminLayout>
      <UserManagement />
    </AdminLayout>
  )
}

export default AdminUsersPage
