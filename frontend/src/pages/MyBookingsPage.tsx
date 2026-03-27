import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, User, Download, XCircle, CheckCircle, AlertCircle, Ticket, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { generateTicketPDF, TicketData } from '../utils/ticketGenerator'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

interface Booking {
  id: number
  pnr: string
  train_name: string
  train_number: string
  from_station: string
  to_station: string
  journey_date: string
  departure_time: string
  arrival_time: string
  class_code: string
  total_passengers: number
  total_amount: number
  status: 'confirmed' | 'waiting' | 'cancelled' | 'completed'
  booking_date: string
  passengers: Array<{
    id: number
    name: string
    age: number
    gender: string
    seat_number?: string
    berth_preference: string
  }>
}

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('railconnect_token')
        if (!token) {
          setError('Please login to view bookings')
          return
        }

        const response = await axios.get(`${API_BASE_URL}/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        setBookings(response.data)
      } catch (err: any) {
        console.error('Failed to fetch bookings:', err)
        setError(err.response?.data?.error || 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter
    const matchesSearch = 
      booking.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.train_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.from_station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.to_station.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed'
      case 'waiting':
        return 'status-waiting'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'waiting':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleCancelBooking = async (bookingId: number, pnr: string, totalAmount: number) => {
    const PENALTY_CHARGE = 200
    const refundAmount = Math.max(0, totalAmount - PENALTY_CHARGE)
    
    const confirmMessage = `Are you sure you want to cancel this ticket?\n\nPNR: ${pnr}\nOriginal Amount: ₹${totalAmount}\nPenalty Charge: ₹${PENALTY_CHARGE}\nRefund Amount: ₹${refundAmount}\n\nThe refund will be processed after cancellation.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const token = localStorage.getItem('railconnect_token')
      if (!token) {
        alert('Please login to cancel bookings')
        return
      }

      const response = await axios.put(
        `${API_BASE_URL}/bookings/${bookingId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      alert(`Ticket cancelled successfully!\n\nRefund Amount: ₹${response.data.refundAmount}\nTransaction ID: ${response.data.transactionId}\n\nYour refund will be processed within 5-7 business days.`)
      
      // Refresh bookings list
      const bookingsResponse = await axios.get(`${API_BASE_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBookings(bookingsResponse.data)
    } catch (error: any) {
      console.error('Failed to cancel booking:', error)
      alert(error.response?.data?.error || 'Failed to cancel booking. Please try again.')
    }
  }

  const handleDownloadTicket = (booking: Booking) => {
    const ticketData: TicketData = {
      pnr: booking.pnr,
      trainNumber: booking.train_number,
      trainName: booking.train_name,
      from: booking.from_station,
      to: booking.to_station,
      fromStation: booking.from_station,
      toStation: booking.to_station,
      date: booking.journey_date,
      departure: booking.departure_time,
      arrival: booking.arrival_time,
      class: booking.class_code,
      passengers: booking.passengers.map(p => ({
        name: p.name,
        age: p.age.toString(),
        gender: p.gender as 'Male' | 'Female' | 'Other',
        seatNumber: p.seat_number || 'TBD'
      })),
      amount: booking.total_amount,
      bookingDate: booking.booking_date,
    }
    generateTicketPDF(ticketData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="card text-center py-12">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading bookings</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Ticket className="h-6 w-6 mr-2" />
              My Bookings
            </h2>
            <p className="text-gray-600">Manage your train reservations and view booking history</p>
          </div>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="btn-secondary mt-4 md:mt-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {/* Filters and Search */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by PNR, train name, or station..."
                className="input-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field w-auto"
              >
                <option value="all">All Bookings</option>
                <option value="confirmed">Confirmed</option>
                <option value="waiting">Waiting</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'You haven\'t made any bookings yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="card">
                {/* Booking Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.train_name} ({booking.train_number})
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(booking.journey_date), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {booking.departure_time} - {booking.arrival_time}
                      </span>
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {booking.total_passengers} passenger{booking.total_passengers > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{booking.total_amount}</p>
                    <p className="text-sm text-gray-600">PNR: {booking.pnr}</p>
                  </div>
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-semibold text-gray-900">{booking.from_station}</p>
                    <p className="text-sm text-gray-600">Departure: {booking.departure_time}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                      <div className="bg-irctc-primary h-1 rounded-full" style={{width: '100%'}}></div>
                    </div>
                    <p className="text-sm text-gray-500">Class: {booking.class_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-semibold text-gray-900">{booking.to_station}</p>
                    <p className="text-sm text-gray-600">Arrival: {booking.arrival_time}</p>
                  </div>
                </div>

                {/* Passenger Details */}
                {booking.passengers && booking.passengers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Passenger Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {booking.passengers.map((passenger, index) => (
                        <div key={passenger.id || index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{passenger.name}</p>
                          <p className="text-sm text-gray-600">
                            {passenger.age} years • {passenger.gender}
                          </p>
                          {passenger.seat_number && (
                            <p className="text-sm text-irctc-primary font-medium">
                              Seat: {passenger.seat_number || 'TBD'}
                            </p>
                          )}
                          {passenger.berth_preference && passenger.berth_preference !== 'No Preference' && (
                            <p className="text-xs text-gray-500">
                              Preference: {passenger.berth_preference}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  {(booking.status === 'confirmed' || booking.status === 'waiting') && (
                    <>
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleDownloadTicket(booking)}
                          className="btn-secondary flex items-center justify-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Ticket
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelBooking(booking.id, booking.pnr, booking.total_amount)}
                        className="btn-danger flex items-center justify-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Stats */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{bookings.length}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'waiting').length}
              </div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-red-600">
                {bookings.filter(b => b.status === 'cancelled').length}
              </div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookingsPage
