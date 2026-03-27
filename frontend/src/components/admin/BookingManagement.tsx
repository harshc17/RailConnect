import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  Ticket,
  Search,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  User,
  RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

const REFRESH_INTERVAL = 20000 // 20 seconds

type BookingStatus = 'confirmed' | 'waiting' | 'cancelled' | 'completed'
type PaymentStatus = 'completed' | 'pending' | 'failed'

interface Passenger {
  name: string
  age: number
  gender: string
  berthPreference: string
  seatNumber: string | null
}

interface Booking {
  id: number
  pnr: string
  userId: number
  userName: string
  userEmail: string
  trainId: number
  trainName: string
  trainNumber: string
  fromStation: string
  toStation: string
  journeyDate: string
  bookingDate: string
  departureTime: string
  arrivalTime: string
  classCode: string
  totalPassengers: number
  totalAmount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  passengers: Passenger[]
}

const BookingManagement: React.FC = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | BookingStatus>('ALL')
  const [filterPayment, setFilterPayment] = useState<'ALL' | PaymentStatus>('ALL')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchBookings = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      const token = localStorage.getItem('railconnect_token')
      const response = await axios.get<Booking[]>(`${API_BASE_URL}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBookings(response.data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch bookings.')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchBookings()

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchBookings(true)
    }, REFRESH_INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleManualRefresh = () => {
    fetchBookings(true)
  }

  const handleStatusChange = async (bookingId: number, newStatus: BookingStatus) => {
    try {
      const token = localStorage.getItem('railconnect_token')
      await axios.patch(
        `${API_BASE_URL}/admin/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Refresh bookings after status change
      fetchBookings(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update booking status.')
    }
  }

  const filteredBookings = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    return bookings.filter(booking => {
      const matchesSearch =
        needle.length === 0 ||
        booking.pnr.toLowerCase().includes(needle) ||
        booking.userName.toLowerCase().includes(needle) ||
        booking.userEmail.toLowerCase().includes(needle) ||
        booking.trainName.toLowerCase().includes(needle) ||
        booking.trainNumber.toLowerCase().includes(needle)

      const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus
      const matchesPayment = filterPayment === 'ALL' || booking.paymentStatus === filterPayment

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [bookings, searchTerm, filterStatus, filterPayment])

  const getStatusColor = (status: BookingStatus) => {
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

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'waiting':
        return <Clock className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalRevenue = useMemo(
    () =>
      bookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
        .filter(booking => booking.paymentStatus === 'completed')
        .reduce((sum, booking) => sum + booking.totalAmount, 0),
    [bookings]
  )

  const pendingPayments = useMemo(
    () =>
      bookings
        .filter(booking => booking.paymentStatus === 'pending')
        .reduce((sum, booking) => sum + booking.totalAmount, 0),
    [bookings]
  )

  if (loading) {
    return <div>Loading booking data...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Monitor and manage all confirmed and pending reservations.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            {lastUpdated && (
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
          <div className="text-sm text-gray-600">Total Bookings</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {
              bookings.filter(
                booking => booking.status === 'confirmed' || booking.status === 'completed'
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            ₹{pendingPayments.toLocaleString('en-IN')}
          </div>
          <div className="text-sm text-gray-600">Pending Payments</div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by PNR, user name, email, or train..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as 'ALL' | BookingStatus)}
              className="input-field w-auto"
            >
              <option value="ALL">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="waiting">Waiting</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value as 'ALL' | PaymentStatus)}
              className="input-field w-auto"
            >
              <option value="ALL">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Train & Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status & Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">PNR: {booking.pnr}</div>
                      <div className="text-sm text-gray-500">Booking ID: {booking.id}</div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{booking.totalAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-irctc-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{booking.userName}</div>
                        <div className="text-sm text-gray-500">{booking.userEmail}</div>
                        <div className="text-xs text-gray-400">ID: {booking.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.trainName}</div>
                      <div className="text-sm text-gray-500">
                        {booking.trainNumber} • {booking.classCode}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {booking.fromStation} → {booking.toStation}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(booking.journeyDate), 'MMM d, yyyy')} •{' '}
                        {booking.departureTime} - {booking.arrivalTime}
                      </div>
                      <div className="text-xs text-gray-400">
                        {booking.passengers.length} passenger
                        {booking.passengers.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </span>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            booking.paymentStatus
                          )}`}
                        >
                          {booking.paymentStatus.charAt(0).toUpperCase() +
                            booking.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin-bookings/${booking.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="Download Ticket"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {booking.status === 'waiting' && (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          className="text-green-600 hover:text-green-900"
                          title="Confirm Booking"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'completed') && (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel Booking"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No bookings match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default BookingManagement
