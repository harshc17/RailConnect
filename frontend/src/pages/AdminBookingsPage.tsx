import React from 'react'
import AdminLayout from '../components/admin/AdminLayout'
import BookingManagement from '../components/admin/BookingManagement'

const AdminBookingsPage: React.FC = () => {
  return (
    <AdminLayout>
      <BookingManagement />
    </AdminLayout>
  )
}

export default AdminBookingsPage
