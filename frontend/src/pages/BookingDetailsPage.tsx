import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Ticket,
  User,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock as ClockIcon
} from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'
import AdminLayout from '../components/admin/AdminLayout'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

interface Passenger {
  id: number
  name: string
  age: number
  gender: string
  berthPreference: string
  seatNumber: string | null
}

interface Transaction {
  id: number
  transactionId: string
  amount: number
  type: string
  status: string
  paymentMethod: string
  createdAt: string
}

interface BookingDetails {
  id: number
  pnr: string
  userId: number
  userName: string
  userEmail: string
  userPhone: string
  trainId: number
  trainName: string
  trainNumber: string
  fromStation: string
  toStation: string
  journeyDate: string
  bookingDate: string
  departureTime: string
  arrivalTime: string
  duration: string
  classCode: string
  totalPassengers: number
  totalAmount: number
  status: 'confirmed' | 'waiting' | 'cancelled' | 'completed'
  paymentStatus: 'completed' | 'pending' | 'failed'
  passengers: Passenger[]
  transactions: Transaction[]
}

const BookingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem('railconnect_token')
        const response = await axios.get<BookingDetails>(`${API_BASE_URL}/admin/bookings/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBooking(response.data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load booking details.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBookingDetails()
    }
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      case 'waiting':
        return <ClockIcon className="h-5 w-5" />
      case 'cancelled':
        return <XCircle className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !booking) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 mb-2">Error: {error || 'Booking not found'}</p>
          <button
            onClick={() => navigate('/admin-bookings')}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin-bookings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">PNR: {booking.pnr}</p>
          </div>
        </div>

        {/* Booking Status Card */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Booking Status</h3>
                <p className="text-sm text-gray-600 capitalize">{booking.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">₹{booking.totalAmount.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Train Information */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Train Information</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Train Name</p>
                <p className="text-base font-medium text-gray-900">{booking.trainName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Train Number</p>
                <p className="text-base font-medium text-gray-900">{booking.trainNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.fromStation} → {booking.toStation}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Journey Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {format(new Date(booking.journeyDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Schedule</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.departureTime} - {booking.arrivalTime}
                  </p>
                  <p className="text-xs text-gray-500">Duration: {booking.duration}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="text-base font-medium text-gray-900">{booking.classCode}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-base font-medium text-gray-900">{booking.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-gray-900">{booking.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-base font-medium text-gray-900">{booking.userPhone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="text-base font-medium text-gray-900">{booking.userId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Booking Date</p>
                <p className="text-base font-medium text-gray-900">
                  {format(new Date(booking.bookingDate), 'MMMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Passengers ({booking.totalPassengers})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Berth Preference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seat Number
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {booking.passengers.map((passenger, index) => (
                  <tr key={passenger.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {passenger.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{passenger.age}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{passenger.gender}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {passenger.berthPreference || 'No Preference'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {passenger.seatNumber || 'Not Assigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions */}
        {booking.transactions && booking.transactions.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>
            <div className="space-y-3">
              {booking.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.type === 'booking' ? 'Booking Payment' : 'Refund'}
                    </p>
                    <p className="text-xs text-gray-600">Transaction ID: {transaction.transactionId}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(transaction.createdAt), 'MMMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-xs text-gray-600">Payment Method: {transaction.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {transaction.type === 'refund' ? '-' : ''}₹{transaction.amount.toLocaleString('en-IN')}
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default BookingDetailsPage

