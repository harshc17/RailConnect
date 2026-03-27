import React, { useState } from 'react'
import { Calendar, MapPin, Clock, User, Download, Eye, XCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  pnr: string
  trainNumber: string
  trainName: string
  from: string
  to: string
  date: string
  departure: string
  arrival: string
  class: string
  passengers: Array<{
    name: string
    age: string
    gender: string
    seatNumber: string
  }>
  status: 'confirmed' | 'waiting' | 'cancelled'
  amount: number
  bookingDate: string
}

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      pnr: 'PNR123456',
      trainNumber: '12001',
      trainName: 'New Delhi - Mumbai Central Rajdhani Express',
      from: 'NDLS',
      to: 'CSMT',
      date: '2024-02-15',
      departure: '16:55',
      arrival: '08:15',
      class: '3A',
      passengers: [
        { name: 'John Doe', age: '30', gender: 'Male', seatNumber: '12A' },
        { name: 'Jane Doe', age: '28', gender: 'Female', seatNumber: '12B' }
      ],
      status: 'confirmed',
      amount: 3990,
      bookingDate: '2024-01-20'
    },
    {
      id: '2',
      pnr: 'PNR789012',
      trainNumber: '12002',
      trainName: 'Mumbai Central - New Delhi Rajdhani Express',
      from: 'CSMT',
      to: 'NDLS',
      date: '2024-02-20',
      departure: '17:00',
      arrival: '08:20',
      class: '2A',
      passengers: [
        { name: 'John Doe', age: '30', gender: 'Male', seatNumber: '8C' }
      ],
      status: 'waiting',
      amount: 2955,
      bookingDate: '2024-01-25'
    },
    {
      id: '3',
      pnr: 'PNR345678',
      trainNumber: '12615',
      trainName: 'Grand Trunk Express',
      from: 'MAS',
      to: 'NDLS',
      date: '2024-01-30',
      departure: '15:00',
      arrival: '19:45',
      class: 'SL',
      passengers: [
        { name: 'John Doe', age: '30', gender: 'Male', seatNumber: '45L' }
      ],
      status: 'cancelled',
      amount: 755,
      bookingDate: '2024-01-10'
    }
  ])

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter
    const matchesSearch = 
      booking.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.to.toLowerCase().includes(searchTerm.toLowerCase())
    
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

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        )
      )
    }
  }

  const handleDownloadTicket = (booking: Booking) => {
    // In real app, this would generate and download a PDF ticket
    alert(`Downloading ticket for PNR: ${booking.pnr}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking History</h2>
          <p className="text-gray-600">Manage your train reservations and view booking history</p>
        </div>
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
                      {booking.trainName} ({booking.trainNumber})
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="capitalize">{booking.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(booking.date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {booking.departure} - {booking.arrival}
                    </span>
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{booking.amount}</p>
                  <p className="text-sm text-gray-600">PNR: {booking.pnr}</p>
                </div>
              </div>

              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-semibold text-gray-900">{booking.from}</p>
                  <p className="text-sm text-gray-600">Departure: {booking.departure}</p>
                </div>
                <div className="text-center">
                  <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                    <div className="bg-irctc-primary h-1 rounded-full" style={{width: '100%'}}></div>
                  </div>
                  <p className="text-sm text-gray-500">Class: {booking.class}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-semibold text-gray-900">{booking.to}</p>
                  <p className="text-sm text-gray-600">Arrival: {booking.arrival}</p>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Passenger Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {booking.passengers.map((passenger, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{passenger.name}</p>
                      <p className="text-sm text-gray-600">
                        {passenger.age} years • {passenger.gender}
                      </p>
                      {passenger.seatNumber && (
                        <p className="text-sm text-irctc-primary font-medium">
                          Seat: {passenger.seatNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                {booking.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleDownloadTicket(booking)}
                      className="btn-secondary flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Ticket
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="btn-danger"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
                
                {booking.status === 'waiting' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="btn-danger"
                  >
                    Cancel Booking
                  </button>
                )}
                
                <button className="btn-secondary flex items-center justify-center">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
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
  )
}

export default BookingHistory
