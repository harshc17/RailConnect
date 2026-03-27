import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, RefreshCw, Clock, Search, Filter, X, Save } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

const REFRESH_INTERVAL = 20000 // 20 seconds

interface TrainClass {
  id?: number
  classCode: string
  className: string
  totalSeats: number
  availableSeats: number
  basePrice: number
}

interface Train {
  id: number
  number: string
  name: string
  fromStation: string
  toStation: string
  departureTime: string
  arrivalTime: string
  duration: string
  days: string | string[]
  type: string
  zone: string
  distance: number
  status: 'active' | 'inactive' | 'cancelled' | 'maintenance'
  classes: TrainClass[]
}

const TrainManagement: React.FC = () => {
  const [trains, setTrains] = useState<Train[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | string>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | Train['status']>('ALL')
  const [editingTrain, setEditingTrain] = useState<Train | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Train>>({})
  const [editClasses, setEditClasses] = useState<TrainClass[]>([])
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTrains = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      const token = localStorage.getItem('railconnect_token')
      const response = await axios.get(`${API_BASE_URL}/admin/trains`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTrains(response.data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch trains.')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchTrains()

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchTrains(true)
    }, REFRESH_INTERVAL)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleManualRefresh = () => {
    fetchTrains(true)
  }

  const handleStatusChange = async (trainId: number, newStatus: Train['status']) => {
    try {
      const token = localStorage.getItem('railconnect_token')
      await axios.patch(
        `${API_BASE_URL}/admin/trains/${trainId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Refresh trains after status change
      fetchTrains(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update train status.')
    }
  }

  const handleEditTrain = async (train: Train) => {
    try {
      const token = localStorage.getItem('railconnect_token')
      const response = await axios.get(`${API_BASE_URL}/admin/trains/${train.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const trainData = response.data
      setEditingTrain(trainData)
      setEditFormData({
        number: trainData.number,
        name: trainData.name,
        fromStation: trainData.fromStation,
        toStation: trainData.toStation,
        departureTime: trainData.departureTime,
        arrivalTime: trainData.arrivalTime,
        duration: trainData.duration,
        days: Array.isArray(trainData.days) ? trainData.days : trainData.days.split(','),
        type: trainData.type,
        zone: trainData.zone,
        distance: trainData.distance,
        status: trainData.status
      })
      setEditClasses(trainData.classes.map((cls: TrainClass) => ({ ...cls })))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load train details.')
    }
  }

  const handleSaveTrain = async () => {
    if (!editingTrain) return

    setSaving(true)
    try {
      const token = localStorage.getItem('railconnect_token')
      
      // Update train details
      await axios.put(
        `${API_BASE_URL}/admin/trains/${editingTrain.id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Update train classes
      await axios.put(
        `${API_BASE_URL}/admin/trains/${editingTrain.id}/classes`,
        { classes: editClasses },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setEditingTrain(null)
      setEditFormData({})
      setEditClasses([])
      fetchTrains(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save train changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddClass = () => {
    setEditClasses([
      ...editClasses,
      {
        classCode: '',
        className: '',
        totalSeats: 0,
        availableSeats: 0,
        basePrice: 0
      }
    ])
  }

  const handleRemoveClass = (index: number) => {
    setEditClasses(editClasses.filter((_, i) => i !== index))
  }

  const handleClassChange = (index: number, field: keyof TrainClass, value: string | number) => {
    const updated = [...editClasses]
    updated[index] = { ...updated[index], [field]: value }
    // Ensure availableSeats doesn't exceed totalSeats
    if (field === 'totalSeats' && updated[index].availableSeats > Number(value)) {
      updated[index].availableSeats = Number(value)
    }
    if (field === 'availableSeats' && Number(value) > updated[index].totalSeats) {
      updated[index].availableSeats = updated[index].totalSeats
    }
    setEditClasses(updated)
  }

  const filteredTrains = trains.filter(train => {
    const matchesSearch =
      train.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.fromStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.toStation.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'ALL' || train.type === filterType
    const matchesStatus = filterStatus === 'ALL' || train.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const uniqueTypes = Array.from(new Set(trains.map(t => t.type))).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading trains...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 mb-2">Error: {error}</p>
        <button
          onClick={handleManualRefresh}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Train Management</h2>
          <p className="text-gray-600">Manage train schedules, routes, and availability.</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{trains.length}</div>
          <div className="text-sm text-gray-600">Total Trains</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {trains.filter(t => t.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Trains</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {trains.filter(t => t.status === 'inactive').length}
          </div>
          <div className="text-sm text-gray-600">Inactive Trains</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {trains.filter(t => t.status === 'cancelled').length}
          </div>
          <div className="text-sm text-gray-600">Cancelled Trains</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by train name, number, or route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | string)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'ALL' | Train['status'])}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trains Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Train No.</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Route</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Schedule</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Classes</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTrains.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  No trains found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredTrains.map((train) => (
                <tr key={train.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{train.number}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{train.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {train.fromStation} → {train.toStation}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <div>{train.departureTime} - {train.arrivalTime}</div>
                    <div className="text-xs text-gray-500">{train.duration}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{train.type}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {train.classes.map((cls, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 rounded text-xs"
                          title={`Available: ${cls.availableSeats}/${cls.totalSeats} seats, Fare: ₹${cls.basePrice}`}
                        >
                          {cls.className} ({cls.availableSeats})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={train.status}
                      onChange={(e) => handleStatusChange(train.id, e.target.value as Train['status'])}
                      className={`text-xs px-2 py-1 rounded ${
                        train.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : train.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      } border-0 focus:ring-2 focus:ring-irctc-primary`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTrain(train)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit train"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Train Modal */}
      {editingTrain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Edit Train: {editingTrain.number}</h3>
              <button
                onClick={() => {
                  setEditingTrain(null)
                  setEditFormData({})
                  setEditClasses([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Train Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Train Number</label>
                    <input
                      type="text"
                      value={editFormData.number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Train Name</label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Station</label>
                    <input
                      type="text"
                      value={editFormData.fromStation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, fromStation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Station</label>
                    <input
                      type="text"
                      value={editFormData.toStation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, toStation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                    <input
                      type="time"
                      value={editFormData.departureTime || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, departureTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                    <input
                      type="time"
                      value={editFormData.arrivalTime || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, arrivalTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={editFormData.duration || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                      placeholder="e.g., 12h 30m"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={editFormData.type || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    >
                      <option value="Express">Express</option>
                      <option value="Superfast">Superfast</option>
                      <option value="Rajdhani">Rajdhani</option>
                      <option value="Shatabdi">Shatabdi</option>
                      <option value="Duronto">Duronto</option>
                      <option value="Mail">Mail</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                    <input
                      type="text"
                      value={editFormData.zone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, zone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                    <input
                      type="number"
                      value={editFormData.distance || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, distance: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editFormData.status || 'active'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Train['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Running Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayAbbr = day.substring(0, 3)
                        const isSelected = Array.isArray(editFormData.days) && editFormData.days.includes(dayAbbr)
                        return (
                          <label key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentDays = Array.isArray(editFormData.days) ? editFormData.days : []
                                if (e.target.checked) {
                                  setEditFormData({ ...editFormData, days: [...currentDays, dayAbbr] })
                                } else {
                                  setEditFormData({ ...editFormData, days: currentDays.filter(d => d !== dayAbbr) })
                                }
                              }}
                              className="mr-1"
                            />
                            <span className="text-sm">{dayAbbr}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Train Classes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Train Classes & Seats</h4>
                  <button
                    onClick={handleAddClass}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Class
                  </button>
                </div>
                <div className="space-y-4">
                  {editClasses.map((cls, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Class {index + 1}</span>
                        <button
                          onClick={() => handleRemoveClass(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Class Code</label>
                          <input
                            type="text"
                            value={cls.classCode}
                            onChange={(e) => handleClassChange(index, 'classCode', e.target.value)}
                            placeholder="e.g., 1A, 2A, 3A"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Class Name</label>
                          <input
                            type="text"
                            value={cls.className}
                            onChange={(e) => handleClassChange(index, 'className', e.target.value)}
                            placeholder="e.g., AC First Class"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Total Seats</label>
                          <input
                            type="number"
                            value={cls.totalSeats}
                            onChange={(e) => handleClassChange(index, 'totalSeats', Number(e.target.value))}
                            min="0"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Available Seats</label>
                          <input
                            type="number"
                            value={cls.availableSeats}
                            onChange={(e) => handleClassChange(index, 'availableSeats', Number(e.target.value))}
                            min="0"
                            max={cls.totalSeats}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Base Price (₹)</label>
                          <input
                            type="number"
                            value={cls.basePrice}
                            onChange={(e) => handleClassChange(index, 'basePrice', Number(e.target.value))}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-irctc-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {editClasses.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No classes added. Click "Add Class" to add one.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditingTrain(null)
                  setEditFormData({})
                  setEditClasses([])
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTrain}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainManagement
