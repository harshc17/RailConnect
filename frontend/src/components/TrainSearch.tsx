import React, { useState, useEffect } from 'react'
import { Search, Calendar, MapPin, Filter, Star, Clock, ArrowRight, Users } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { fetchRailwayStations, RailwayStation } from '../data/railwayStations'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const TrainSearch: React.FC = () => {
  const navigate = useNavigate()
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    class: 'ALL'
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    trainType: 'ALL',
    departureTime: 'ALL',
    priceRange: [0, 5000]
  })
  const [allRailwayStations, setAllRailwayStations] = useState<RailwayStation[]>([])

  useEffect(() => {
    const getStations = async () => {
      const stations = await fetchRailwayStations()
      setAllRailwayStations(stations)
    }
    getStations()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchData.from || !searchData.to) {
      alert('Please select both source and destination stations')
      return
    }

    setLoading(true)

    try {
      const { from, to, date } = searchData
      const response = await axios.get(`${API_BASE_URL}/trains`, {
        params: { from, to, date }
      })
      setSearchResults(response.data)
    } catch (error) {
      console.error('Search error:', error)
      alert('Failed to search for trains. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = (trainId: string) => {
    navigate(`/booking/${trainId}`, { 
      state: { 
        train: searchResults.find(t => t.id === trainId),
        searchData 
      }
    })
  }

  const filteredResults = searchResults.filter(train => {
    if (filters.trainType !== 'ALL' && train.type !== filters.trainType) return false
    if (filters.departureTime !== 'ALL') {
      const hour = parseInt(train.departure.split(':')[0])
      if (filters.departureTime === 'MORNING' && (hour < 6 || hour >= 12)) return false
      if (filters.departureTime === 'AFTERNOON' && (hour < 12 || hour >= 18)) return false
      if (filters.departureTime === 'EVENING' && (hour < 18 || hour >= 22)) return false
      if (filters.departureTime === 'NIGHT' && (hour < 22 && hour >= 6)) return false
    }
    
    const minPrice = Math.min(...Object.values(train.classes).map((c: any) => c.price))
    if (minPrice < filters.priceRange[0] || minPrice > filters.priceRange[1]) return false
    
    return true
  })

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Trains</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Station
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter source station"
                  className="input-field pl-10"
                  value={searchData.from}
                  onChange={(e) => setSearchData({...searchData, from: e.target.value})}
                  list="from-stations"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <datalist id="from-stations">
                  {railwayStations.map(station => (
                    <option key={station.code} value={station.code}>
                      {station.name} ({station.code})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Station
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter destination station"
                  className="input-field pl-10"
                  value={searchData.to}
                  onChange={(e) => setSearchData({...searchData, to: e.target.value})}
                  list="to-stations"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <datalist id="to-stations">
                  {railwayStations.map(station => (
                    <option key={station.code} value={station.code}>
                      {station.name} ({station.code})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Journey
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="input-field pl-10"
                  value={searchData.date}
                  onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                className="input-field"
                value={searchData.class}
                onChange={(e) => setSearchData({...searchData, class: e.target.value})}
              >
                <option value="ALL">All Classes</option>
                <option value="1A">AC First Class (1A)</option>
                <option value="2A">AC 2 Tier (2A)</option>
                <option value="3A">AC 3 Tier (3A)</option>
                <option value="SL">Sleeper (SL)</option>
                <option value="CC">Chair Car (CC)</option>
                <option value="EC">Executive Class (EC)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="inline h-5 w-5 mr-2" />
              {loading ? 'Searching...' : 'Search Trains'}
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              <Filter className="inline h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Train Type</label>
                <select
                  className="input-field"
                  value={filters.trainType}
                  onChange={(e) => setFilters({...filters, trainType: e.target.value})}
                >
                  <option value="ALL">All Types</option>
                  <option value="Rajdhani">Rajdhani</option>
                  <option value="Shatabdi">Shatabdi</option>
                  <option value="Duronto">Duronto</option>
                  <option value="Superfast">Superfast</option>
                  <option value="Express">Express</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                <select
                  className="input-field"
                  value={filters.departureTime}
                  onChange={(e) => setFilters({...filters, departureTime: e.target.value})}
                >
                  <option value="ALL">All Times</option>
                  <option value="MORNING">Morning (6 AM - 12 PM)</option>
                  <option value="AFTERNOON">Afternoon (12 PM - 6 PM)</option>
                  <option value="EVENING">Evening (6 PM - 10 PM)</option>
                  <option value="NIGHT">Night (10 PM - 6 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters({...filters, priceRange: [0, parseInt(e.target.value)]})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹0</span>
                    <span>₹{filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {loading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-irctc-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for trains...</p>
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {filteredResults.length} trains found
            </h3>
            <p className="text-sm text-gray-600">
              {format(new Date(searchData.date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {filteredResults.map((train) => (
            <div key={train.id} className="train-card">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Train Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {train.name} ({train.number})
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          4.5
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          On Time
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {train.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Route and Timing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Departure</p>
                      <p className="font-semibold text-gray-900">{train.departure}</p>
                      <p className="text-sm text-gray-600">{train.from}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{train.duration}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                        <div className="bg-irctc-primary h-1 rounded-full" style={{width: '100%'}}></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Arrival</p>
                      <p className="font-semibold text-gray-900">{train.arrival}</p>
                      <p className="text-sm text-gray-600">{train.to}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing and Booking */}
                <div className="lg:col-span-1">
                  <div className="space-y-3 mb-4">
                    {Object.entries(train.classes).map(([className, classData]: [string, any]) => (
                      <div key={className} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{className}</span>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{classData.price}</p>
                          <p className="text-xs text-gray-500">{classData.available} seats</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleBookNow(train.id)}
                    className="w-full btn-primary"
                  >
                    Book Now
                    <ArrowRight className="inline h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searchResults.length === 0 && searchData.from && searchData.to && (
        <div className="card text-center py-12">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No trains found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or date</p>
        </div>
      )}
    </div>
  )
}

export default TrainSearch
