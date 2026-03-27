import React, { useState, useEffect } from 'react'
import { CreditCard, Calendar, Receipt, Download, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

interface Transaction {
  id: string
  booking_id: string
  pnr: string
  amount: number
  type: 'booking' | 'cancellation' | 'refund'
  status: 'completed' | 'pending' | 'failed'
  payment_method: string
  transaction_id: string
  created_at: string
  description: string
  train_name?: string
  train_number?: string
  from_station?: string
  to_station?: string
  class_code?: string
}

const MyTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('railconnect_token')
        if (!token) {
          setError('Please login to view transactions')
          return
        }

        const response = await axios.get(`${API_BASE_URL}/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        // Transform API response to match our interface and add description
        const transformedTransactions = response.data.map((txn: any) => ({
          id: txn.id.toString(),
          booking_id: txn.booking_id.toString(),
          pnr: txn.pnr,
          amount: parseFloat(txn.amount),
          type: txn.type,
          status: txn.status,
          payment_method: txn.payment_method,
          transaction_id: txn.transaction_id,
          created_at: txn.created_at,
          train_name: txn.train_name,
          train_number: txn.train_number,
          from_station: txn.from_station,
          to_station: txn.to_station,
          class_code: txn.class_code,
          description: txn.type === 'refund'
            ? `Refund for ${txn.train_name || 'Train'} (${txn.class_code || 'N/A'}) - ${txn.from_station || ''} to ${txn.to_station || ''}`
            : `${txn.from_station || ''} - ${txn.to_station || ''} ${txn.train_name || 'Train'} (${txn.class_code || 'N/A'})`
        }))

        // For refunds, make amount negative
        const adjustedTransactions = transformedTransactions.map((txn: Transaction) => {
          if (txn.type === 'refund') {
            return { ...txn, amount: -Math.abs(txn.amount) }
          }
          return txn
        })

        setTransactions(adjustedTransactions)
      } catch (err: any) {
        console.error('Failed to fetch transactions:', err)
        setError(err.response?.data?.error || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter
    const matchesSearch = 
      transaction.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'text-blue-600 bg-blue-100'
      case 'cancellation':
        return 'text-red-600 bg-red-100'
      case 'refund':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleDownloadReceipt = (transaction: Transaction) => {
    // In real app, this would generate and download a PDF receipt
    alert(`Downloading receipt for transaction: ${transaction.transaction_id}`)
  }

  const handleCancelBooking = async (transaction: Transaction) => {
    if (transaction.type !== 'booking') {
      alert('Only booking transactions can be cancelled')
      return
    }

    const PENALTY_CHARGE = 200
    const currentAmount = Math.abs(transaction.amount)
    const refundAmount = Math.max(0, currentAmount - PENALTY_CHARGE)
    
    const confirmMessage = `Are you sure you want to cancel this ticket?\n\nPNR: ${transaction.pnr}\nOriginal Amount: ₹${currentAmount}\nPenalty Charge: ₹${PENALTY_CHARGE}\nRefund Amount: ₹${refundAmount}\n\nThe refund will be processed after cancellation.`
    
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
        `${API_BASE_URL}/bookings/${transaction.booking_id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      alert(`Ticket cancelled successfully!\n\nRefund Amount: ₹${response.data.refundAmount}\nTransaction ID: ${response.data.transactionId}\n\nYour refund will be processed within 5-7 business days.`)
      
      // Refresh transactions list
      const transactionsResponse = await axios.get(`${API_BASE_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const transformedTransactions = transactionsResponse.data.map((txn: any) => ({
        id: txn.id.toString(),
        booking_id: txn.booking_id.toString(),
        pnr: txn.pnr,
        amount: parseFloat(txn.amount),
        type: txn.type,
        status: txn.status,
        payment_method: txn.payment_method,
        transaction_id: txn.transaction_id,
        created_at: txn.created_at,
        train_name: txn.train_name,
        train_number: txn.train_number,
        from_station: txn.from_station,
        to_station: txn.to_station,
        class_code: txn.class_code,
        description: txn.type === 'refund'
          ? `Refund for ${txn.train_name || 'Train'} (${txn.class_code || 'N/A'}) - ${txn.from_station || ''} to ${txn.to_station || ''}`
          : `${txn.from_station || ''} - ${txn.to_station || ''} ${txn.train_name || 'Train'} (${txn.class_code || 'N/A'})`
      }))

      const adjustedTransactions = transformedTransactions.map((txn: Transaction) => {
        if (txn.type === 'refund') {
          return { ...txn, amount: -Math.abs(txn.amount) }
        }
        return txn
      })

      setTransactions(adjustedTransactions)
    } catch (error: any) {
      console.error('Failed to cancel booking:', error)
      alert(error.response?.data?.error || 'Failed to cancel booking. Please try again.')
    }
  }

  const totalSpent = transactions
    .filter(t => t.type === 'booking' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalRefunded = transactions
    .filter(t => t.type === 'refund' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading transactions</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Transactions</h2>
            <p className="text-gray-600">View all your payment transactions and receipts</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">₹{totalSpent.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">₹{totalRefunded.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Refunded</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by PNR, transaction ID, or description..."
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
                <option value="all">All Transactions</option>
                <option value="booking">Bookings</option>
                <option value="cancellation">Cancellations</option>
                <option value="refund">Refunds</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="card text-center py-12">
            <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'You haven\'t made any transactions yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transaction.description}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="capitalize">{transaction.status}</span>
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>PNR:</strong> {transaction.pnr}</p>
                        <p><strong>Transaction ID:</strong> {transaction.transaction_id}</p>
                      </div>
                      <div>
                        <p><strong>Payment Method:</strong> {transaction.payment_method}</p>
                        <p><strong>Date:</strong> {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 text-right">
                    <p className={`text-2xl font-bold ${transaction.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {transaction.amount < 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transaction.amount < 0 ? 'Refund' : 'Payment'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDownloadReceipt(transaction)}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </button>
                  
                  <button className="btn-secondary flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>

                  {transaction.type === 'booking' && transaction.status === 'completed' && (
                    <button
                      onClick={() => handleCancelBooking(transaction)}
                      className="btn-danger flex items-center justify-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyTransactionsPage

