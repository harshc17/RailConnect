import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Train, LogOut, Search, Ticket, Calendar, MapPin, ArrowRight, Clock, FileText, User, ChevronRight, CheckCircle, Send, ArrowUpDown, Briefcase, Grid, Trash2 } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'

// Use proxy in development (localhost:3000 -> localhost:5000), or explicit URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [fromStation, setFromStation] = useState('')
  const [toStation, setToStation] = useState('')
  const [journeyDate, setJourneyDate] = useState('')
  const [journeyClass, setJourneyClass] = useState('ALL')
  const [journeyQuota, setJourneyQuota] = useState('GN')
  const [fromStationSuggestions, setFromStationSuggestions] = useState<any[]>([])
  const [toStationSuggestions, setToStationSuggestions] = useState<any[]>([])
  const [trains, setTrains] = useState<any[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [isTransactionsMenuOpen, setIsTransactionsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [activeSearchTab, setActiveSearchTab] = useState<'search' | 'pnr'>('search')
  const [pnrInput, setPnrInput] = useState('')
  const [pnrResult, setPnrResult] = useState<any>(null)
  const [loadingPnr, setLoadingPnr] = useState(false)
  const [pnrSearchPerformed, setPnrSearchPerformed] = useState(false)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/bookings`)
        setBookings(response.data)
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      } finally {
        setLoadingBookings(false)
      }
    }
    fetchBookings()
  }, [])

  useEffect(() => {
    const fetchStations = async (query: string, type: 'from' | 'to') => {
      if (query.length < 2) {
        if (type === 'from') setFromStationSuggestions([])
        if (type === 'to') setToStationSuggestions([])
        return
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/stations?search=${query}`)
        if (type === 'from') setFromStationSuggestions(response.data)
        if (type === 'to') setToStationSuggestions(response.data)
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      }
    }

    const fromDebounce = setTimeout(() => fetchStations(fromStation, 'from'), 300)
    return () => clearTimeout(fromDebounce)
  }, [fromStation])

  useEffect(() => {
    const fetchStations = async (query: string, type: 'from' | 'to') => {
      if (query.length < 2) {
        if (type === 'to') setToStationSuggestions([])
        return
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/stations?search=${query}`)
        if (type === 'to') setToStationSuggestions(response.data)
      } catch (error) {
        console.error('Failed to fetch stations:', error)
      }
    }

    const toDebounce = setTimeout(() => fetchStations(toStation, 'to'), 300)
    return () => clearTimeout(toDebounce)
  }, [toStation])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromStation || !toStation || !journeyDate) {
      alert('Please fill in all search fields.')
      return
    }

    setLoadingSearch(true)
    setSearchPerformed(true)
    setTrains([])

    // Extract station codes from "Station Name (CODE)" format
    const fromCode = fromStation.match(/\(([^)]+)\)/)?.[1]
    const toCode = toStation.match(/\(([^)]+)\)/)?.[1]

    if (!fromCode || !toCode) {
      alert('Please select valid stations from the list.')
      setLoadingSearch(false)
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/trains`, {
        params: { from: fromCode, to: toCode, date: journeyDate }
      })
      setTrains(response.data)
    } catch (error) {
      console.error('Failed to search trains:', error)
    } finally {
      setLoadingSearch(false)
    }
  }

  const handleBookNow = (train: any) => {
    navigate(`/booking/${train.id}`, { state: { train, searchData: { date: journeyDate } } })
  }

  const handleTabChange = (tab: 'search' | 'pnr') => {
    setActiveSearchTab(tab)
    // Reset other search states when switching tabs
    setSearchPerformed(false)
    setPnrSearchPerformed(false)
  }

  const handlePnrCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pnrInput) {
      alert('Please enter a PNR number.')
      return
    }
    setLoadingPnr(true)
    setPnrSearchPerformed(true)
    setPnrResult(null)
    try {
      const response = await axios.get(`${API_BASE_URL}/pnr-status/${pnrInput}`)
      setPnrResult(response.data)
    } catch (error) {
      console.error('Failed to fetch PNR status:', error)
    } finally {
      setLoadingPnr(false)
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

  const handleDeleteAccount = async () => {
    const confirmMessage = `⚠️ WARNING: Account Deletion\n\nAre you absolutely sure you want to delete your account?\n\nThis action is IRREVERSIBLE and will:\n• Delete all your bookings\n• Delete all your transaction history\n• Cancel any active bookings\n• Permanently remove your account\n\nThis cannot be undone!`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const token = localStorage.getItem('railconnect_token')
      if (!token) {
        alert('Please login to delete your account')
        return
      }

      console.log('Attempting to delete account, API URL:', `${API_BASE_URL}/auth/account`)
      
      const response = await axios.delete(`${API_BASE_URL}/auth/account`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000 // 10 second timeout
      })

      console.log('Delete account response:', response.data)

      // Logout immediately (clears token and user state)
      logout()
      
      // Show success message after logout
      alert('Your account has been deleted successfully.')
      
      // Navigate to home
      navigate('/')
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      })
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        alert('Cannot connect to the server. Please ensure the backend server is running on port 5000.\n\nTo start the server, run: cd server && npm run dev')
      } else if (error.response?.status === 403) {
        alert('Admin accounts cannot be deleted.')
      } else if (error.response?.status === 401) {
        alert('Your session has expired. Please login again.')
        logout()
        navigate('/')
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete account. Please try again.'
        alert(`Error: ${errorMessage}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="irctc-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded-lg">
                <Train className="h-6 w-6 text-irctc-primary" />
              </div>
              <span className="text-xl font-bold">RailConnect</span>
            </div>
            <div className="flex items-center space-x-6 lg:mr-4">
              <Link
                to="/my-bookings"
                className="flex items-center space-x-2 hover:text-irctc-light transition-colors"
              >
                <Ticket className="h-5 w-5" />
                <span>My Bookings</span>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center space-x-2 hover:text-irctc-light transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>My Account</span>
                </button>
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-semibold">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div
                        className="relative"
                        onMouseEnter={() => setIsProfileMenuOpen(true)}
                        onMouseLeave={() => setIsProfileMenuOpen(false)}
                      >
                        <button className="w-full text-left flex justify-between items-center text-gray-700 px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">
                          My Profile
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        {isProfileMenuOpen && (
                          <div className="absolute left-full -top-1 mt-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="py-1">
                            <Link to="/my-account/profile" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Update Profile</Link>
                            <Link to="/my-account/change-password" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Change Password</Link>
                              <a href="#" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Add / Modify Master List</a>
                              <a href="#" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Add / Delete Recent Journey List</a>
                            </div>
                          </div>
                        )}
                      </div>
                    <div
                      className="relative"
                      onMouseEnter={() => setIsTransactionsMenuOpen(true)}
                      onMouseLeave={() => setIsTransactionsMenuOpen(false)}
                    >
                      <button className="w-full text-left flex justify-between items-center text-gray-700 px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">
                        My Transactions
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      {isTransactionsMenuOpen && (
                        <div className="absolute left-full -top-1 mt-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                          <div className="py-1">
                            <Link to="/my-account/transactions" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Booked Ticket History</Link>
                            <a href="#" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Failed Transaction History</a>
                            <a href="#" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Ticket Refund History</a>
                            <a href="#" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Ticket Cancellation History</a>
                          </div>
                        </div>
                      )}
                    </div>
                      <a href="#" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">Authenticate User</a>
                      <button
                        onClick={handleDeleteAccount}
                        className="w-full text-left flex items-center text-red-600 px-4 py-2 text-sm hover:bg-red-50"
                        role="menuitem"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                      </button>
                      <a href="#" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">Feedback</a>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 hover:text-irctc-light transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: BOOK TICKET Form */}
          <div>
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">BOOK TICKET</h2>
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-6">
                  <button
                    onClick={() => handleTabChange('search')}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeSearchTab === 'search'
                        ? 'border-irctc-primary text-irctc-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Search className="h-4 w-4" />
                    <span>Search Trains</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('pnr')}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeSearchTab === 'pnr'
                        ? 'border-irctc-primary text-irctc-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>PNR Status</span>
                  </button>
                </nav>
              </div>

              {activeSearchTab === 'search' && (
                <form className="space-y-4" onSubmit={handleSearch}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                    <div className="relative">
                      <Send className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        className="input-field pl-10"
                        placeholder="e.g. New Delhi"
                        list="from-station-list"
                        value={fromStation}
                        onChange={(e) => setFromStation(e.target.value)}
                      />
                    </div>
                    <datalist id="from-station-list">
                      {fromStationSuggestions.map((station) => (
                        <option
                          key={station.code}
                          value={`${station.name} (${station.code})`}
                        />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const temp = fromStation
                        setFromStation(toStation)
                        setToStation(temp)
                      }}
                      className="p-2 border-2 border-gray-300 rounded-full hover:border-blue-600 transition-colors"
                    >
                      <ArrowUpDown className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        className="input-field pl-10"
                        placeholder="e.g. Mumbai"
                        list="to-station-list"
                        value={toStation}
                        onChange={(e) => setToStation(e.target.value)}
                      />
                    </div>
                    <datalist id="to-station-list">
                      {toStationSuggestions.map((station) => (
                        <option
                          key={station.code}
                          value={`${station.name} (${station.code})`}
                        />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        className="input-field pl-10"
                        value={journeyDate}
                        onChange={(e) => setJourneyDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">All Classes</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          className="input-field pl-10"
                          value={journeyClass}
                          onChange={(e) => setJourneyClass(e.target.value)}
                        >
                          <option value="ALL">All Classes</option>
                          <option value="1A">AC First Class (1A)</option>
                          <option value="2A">AC 2 Tier (2A)</option>
                          <option value="3A">AC 3 Tier (3A)</option>
                          <option value="SL">Sleeper (SL)</option>
                          <option value="CC">Chair Car (CC)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GENERAL</label>
                      <div className="relative">
                        <Grid className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          className="input-field pl-10"
                          value={journeyQuota}
                          onChange={(e) => setJourneyQuota(e.target.value)}
                        >
                          <option value="GN">General</option>
                          <option value="TQ">Tatkal</option>
                          <option value="LD">Ladies</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full btn-primary">
                    Search
                  </button>
                </form>
              )}

              {activeSearchTab === 'pnr' && (
                <form className="space-y-4" onSubmit={handlePnrCheck}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enter PNR Number</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="10-digit PNR number"
                      value={pnrInput}
                      onChange={(e) => setPnrInput(e.target.value)}
                      maxLength={10}
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary">
                    Check Status
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Transaction and Journey Details */}
          <div>
            {pnrSearchPerformed ? (
              // PNR Status View
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">PNR Status</h2>
                {loadingPnr ? (
                  <p>Checking PNR status...</p>
                ) : pnrResult ? (
                  <div className="space-y-4">
                    <p><strong>PNR:</strong> {pnrResult.pnr}</p>
                    <p><strong>Train:</strong> {pnrResult.train_name} ({pnrResult.train_number})</p>
                    <p><strong>Route:</strong> {pnrResult.from_station} to {pnrResult.to_station}</p>
                    <p><strong>Journey Date:</strong> {format(new Date(pnrResult.journey_date), 'MMM d, yyyy')}</p>
                    <p><strong>Status:</strong> <span className="capitalize font-medium text-green-600">{pnrResult.status}</span></p>
                    <h3 className="font-semibold pt-2 border-t">Passengers</h3>
                    {pnrResult.passengers.map((p: any, i: number) => (
                      <p key={i}>
                        {i + 1}. {p.name} ({p.age}, {p.gender}) - <span className="font-medium text-irctc-primary">Seat: {p.seat_number || 'TBD'}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p>PNR not found. Please check the number and try again.</p>
                )}
              </div>
            ) : searchPerformed ? (
              // Search Results View
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                {loadingSearch ? (
                  <p>Finding trains for you...</p>
                ) : trains.length > 0 ? (
                  <div className="space-y-4">
                    {trains.map((train) => (
                      <div key={train.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{train.name} ({train.number})</p>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <span>{train.from_station}</span>
                              <ArrowRight className="h-4 w-4 mx-2" />
                              <span>{train.to_station}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{train.departure_time} - {train.arrival_time} ({train.duration})</span>
                            </div>
                          </div>
                          <button onClick={() => handleBookNow(train)} className="btn-primary whitespace-nowrap">
                            Book Now
                          </button>
                        </div>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(train.classes).map(([code, details]: [string, any]) => (
                            <div key={code} className="text-center border border-gray-200 rounded p-2">
                              <p className="font-semibold text-sm">{details.name}</p>
                              <p className="text-green-600 text-xs">Available {details.available}</p>
                              <p className="text-sm font-bold">₹{details.price}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No trains found for this route on the selected date.</p>
                )}
              </div>
            ) : (
              // Default: Transaction and Journey Info
              <div className="space-y-6">
                {/* Last Transaction Detail */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Last Transaction Detail</h2>
                    {bookings.length > 0 && (
                      <Link to="/my-account/transactions" className="text-blue-600 hover:text-blue-800 text-sm">
                        View Details →
                      </Link>
                    )}
                  </div>
                  {loadingBookings ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : bookings.length > 0 ? (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Transaction ID:</p>
                          <p className="font-medium">{bookings[0].pnr}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status:</p>
                          <p className={`font-medium capitalize ${bookings[0].status === 'confirmed' ? 'text-green-600' : bookings[0].status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {bookings[0].status}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date:</p>
                          <p className="font-medium">{format(new Date(bookings[0].booking_date), 'dd MMM yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">From:</p>
                          <p className="font-medium">{bookings[0].from_station}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">To:</p>
                          <p className="font-medium">{bookings[0].to_station}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Class:</p>
                          <p className="font-medium">{bookings[0].class_code}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">No transactions yet</p>
                  )}
                </div>

                {/* Upcoming Journey */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Upcoming Journey</h2>
                    {bookings.filter((b: any) => new Date(b.journey_date) >= new Date() && b.status === 'confirmed').length > 0 && (
                      <Link to="/my-bookings" className="text-blue-600 hover:text-blue-800 text-sm">
                        View All Journeys →
                      </Link>
                    )}
                  </div>
                  {loadingBookings ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : bookings.filter((b: any) => new Date(b.journey_date) >= new Date() && b.status === 'confirmed').length > 0 ? (
                    bookings
                      .filter((b: any) => new Date(b.journey_date) >= new Date() && b.status === 'confirmed')
                      .slice(0, 1)
                      .map((booking: any) => (
                        <div key={booking.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="font-bold text-lg">{booking.train_name}</p>
                              <p className="text-gray-600">({booking.train_number})</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span>{booking.from_station} → {booking.to_station}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{format(new Date(booking.journey_date), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span>Class: {booking.class_code}</span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-600">No upcoming journeys</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard