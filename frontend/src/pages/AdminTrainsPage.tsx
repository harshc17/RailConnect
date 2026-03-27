import React from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import TrainManagement from '../components/admin/TrainManagement'

const AdminTrainsPage: React.FC = () => {
  return (
    <AdminLayout>
      <TrainManagement />
    </AdminLayout>
  )
}

export default AdminTrainsPage
