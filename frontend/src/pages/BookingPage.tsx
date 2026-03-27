import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Train, Clock, MapPin, Users, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'
import { generateTicketPDF, TicketData } from '../utils/ticketGenerator'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

interface Passenger {
  name: string
  age: string
  gender: 'Male' | 'Female' | 'Other'
  berthPreference: 'Lower' | 'Middle' | 'Upper' | 'Side Lower' | 'Side Upper' | 'No Preference'
}

interface BookingData {
  train?: any
  searchData?: any
}

const BookingPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { trainId } = useParams<{ trainId: string }>()
  const { train: initialTrain, searchData: initialSearchData } = (location.state as BookingData) || {}

  const [train, setTrain] = useState<any>(initialTrain)
  const [searchData, setSearchData] = useState<any>(initialSearchData)
  const [selectedClass, setSelectedClass] = useState('')
  const [passengers, setPassengers] = useState<Passenger[]>([
    { name: '', age: '', gender: 'Male', berthPreference: 'No Preference' }
  ])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(!initialTrain)
  const [bookingResult, setBookingResult] = useState<any>(null)
  const [step, setStep] = useState(1) // 1: Class Selection, 2: Passenger Details, 3: Payment, 4: Confirmation

  useEffect(() => {
    if (!train) {
      const fetchTrainData = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/trains/${trainId}`)
          setTrain(response.data)
          // Set a default journey date if not available from state
          if (!searchData) {
            setSearchData({ date: new Date().toISOString().split('T')[0] })
          }
        } catch (error) {
          console.error('Failed to fetch train data:', error)
          navigate('/user-dashboard') // Redirect if train not found
        } finally {
          setIsLoading(false)
        }
      }
      fetchTrainData()
    }
  }, [train, searchData, trainId, navigate])

  const handleAddPassenger = () => {
    if (passengers.length < 6) {
      setPassengers([...passengers, { name: '', age: '', gender: 'Male', berthPreference: 'No Preference' }])
    }
  }

  const handleRemovePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index))
    }
  }

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    const updatedPassengers = [...passengers]
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value }
    setPassengers(updatedPassengers)
  }

  const handleProceedToPayment = () => {
    if (!selectedClass) {
      alert('Please select a class')
      return
    }

    const emptyFields = passengers.some(p => !p.name || !p.age)
    if (emptyFields) {
      alert('Please fill in all passenger details')
      return
    }

    setStep(3)
  }

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }

    setIsProcessing(true)

    try {
      const token = localStorage.getItem('railconnect_token')
      if (!token) {
        alert('You must be logged in to make a booking.')
        setIsProcessing(false)
        navigate('/login') // Redirect to login if no token
        return
      }

      const bookingDetails = {
        trainId: train.id,
        journeyDate: searchData.date,
        classCode: selectedClass,
        passengers: passengers,
        totalAmount: calculateTotal() + 50,
        paymentMethod: paymentMethod,
      }

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingDetails),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Booking failed')
      }

      const result = await response.json()
      setBookingResult(result)
      setStep(4)
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(`An error occurred during booking: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadTicket = () => {
    if (!bookingResult || !train) return

    const ticketData: TicketData = {
      pnr: bookingResult.booking.pnr,
      trainNumber: train.number,
      trainName: train.name,
      from: train.from_station, // Station code
      to: train.to_station,     // Station code
      fromStation: train.from_station, // Assuming code is used as name for now
      toStation: train.to_station,     // Assuming code is used as name for now
      date: searchData.date,
      departure: train.departure_time, 
      arrival: train.arrival_time,
      class: selectedClass,
      passengers: bookingResult.booking.passengers.map((p: any) => ({
        ...p,
        seatNumber: p.seat_number || 'TBD'
      })),
      amount: calculateTotal() + 50,
      bookingDate: new Date().toISOString(),
    }
    generateTicketPDF(ticketData)
  }

  const calculateTotal = () => {
    if (!selectedClass || !train) return 0
    const classData = train.classes[selectedClass]
    return classData ? classData.price * passengers.length : 0
  }

  if (isLoading || !train || !searchData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/user-dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Search</span>
            </button>
            <div className="text-sm text-gray-500">
              Step {step} of 4
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Train Summary */}
            <div className="card">
              <div className="flex items-center space-x-3 mb-4">
                <Train className="h-6 w-6 text-irctc-primary" />
                <h2 className="text-xl font-semibold text-gray-900">Train Details</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Train</p>
                  <p className="font-semibold text-gray-900">{train.name}</p>
                  <p className="text-sm text-gray-600">{train.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{train.from_station} → {train.to_station}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Journey Date</p>
                  <p className="text-sm text-gray-900">{format(new Date(searchData.date), 'MMM d, yyyy')}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{train.departure_time} - {train.arrival_time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Class Selection */}
            {step === 1 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Class</h3>
                <div className="space-y-4">
                  {Object.entries(train.classes).map(([className, classData]: [string, any]) => (
                    <div
                      key={className}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedClass === className
                          ? 'border-irctc-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClass(className)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{className}</h4>
                          <p className="text-sm text-gray-600">{classData.available} seats available</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">₹{classData.price}</p>
                          <p className="text-sm text-gray-600">per passenger</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedClass}
                  className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Passenger Details
                </button>
              </div>
            )}

            {/* Step 2: Passenger Details */}
            {step === 2 && (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Passenger Details</h3>
                  <button
                    onClick={handleAddPassenger}
                    disabled={passengers.length >= 6}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add Passenger
                  </button>
                </div>

                <div className="space-y-4">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Passenger {index + 1}</h4>
                        {passengers.length > 1 && (
                          <button
                            onClick={() => handleRemovePassenger(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={passenger.name}
                            onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                            placeholder="Enter passenger name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Age
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            value={passenger.age}
                            onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                            placeholder="Enter age"
                            min="1"
                            max="120"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gender
                          </label>
                          <select
                            className="input-field"
                            value={passenger.gender}
                            onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Berth Preference
                          </label>
                          <select
                            className="input-field"
                            value={passenger.berthPreference}
                            onChange={(e) => handlePassengerChange(index, 'berthPreference', e.target.value)}
                          >
                            <option value="No Preference">No Preference</option>
                            <option value="Lower">Lower</option>
                            <option value="Middle">Middle</option>
                            <option value="Upper">Upper</option>
                            <option value="Side Lower">Side Lower</option>
                            <option value="Side Upper">Side Upper</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    className="btn-primary"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      {['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'].map((method) => (
                        <label key={method} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-irctc-primary focus:ring-irctc-primary border-gray-300"
                          />
                          <CreditCard className="h-5 w-5 ml-3 text-gray-400" />
                          <span className="ml-3 text-sm font-medium text-gray-900">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={!paymentMethod || isProcessing}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing Payment...' : 'Complete Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="card">
                <div className="text-center mb-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h3>
                  <p className="text-gray-600">Your booking is confirmed.</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-800">
                      PNR: <strong>{bookingResult?.booking?.pnr}</strong> - Please save this for future reference
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Train Details</h4>
                      <p className="text-sm text-gray-600">{train.name} ({train.number})</p>
                      <p className="text-sm text-gray-600">{train.from_station} → {train.to_station}</p>
                      <p className="text-sm text-gray-600">Class: {selectedClass}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Journey Details</h4>
                      <p className="text-sm text-gray-600">Date: {format(new Date(searchData.date), 'MMM d, yyyy')}</p>
                      <p className="text-sm text-gray-600">Departure: {train.departure_time}</p>
                      <p className="text-sm text-gray-600">Arrival: {train.arrival_time}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Passengers</h4>
                    {bookingResult.booking.passengers.map((passenger: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600 mb-1">
                        {passenger.name} ({passenger.age} years, {passenger.gender}) - 
                        <span className="font-semibold text-irctc-primary"> Seat: {passenger.seat_number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => navigate('/user-dashboard')}
                    className="btn-primary"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleDownloadTicket}
                    className="btn-secondary"
                  >
                    Download Ticket
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Train</p>
                  <p className="font-medium text-gray-900">{train.name}</p>
                  <p className="text-sm text-gray-600">{train.number}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="font-medium text-gray-900">{train.from_station} → {train.to_station}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Journey Date</p>
                  <p className="font-medium text-gray-900">{format(new Date(searchData.date), 'MMM d, yyyy')}</p>
                </div>

                {selectedClass && (
                  <div>
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="font-medium text-gray-900">{selectedClass}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Passengers</p>
                  <p className="font-medium text-gray-900">{passengers.length} passenger{passengers.length > 1 ? 's' : ''}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Base Fare</span>
                    <span className="text-sm text-gray-900">₹{selectedClass ? train.classes[selectedClass]?.price || 0 : 0} × {passengers.length}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Service Charges</span>
                    <span className="text-sm text-gray-900">₹50</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total Amount</span>
                    <span>₹{calculateTotal() + 50}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
