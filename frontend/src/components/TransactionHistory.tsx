import React, { useState } from 'react'
import { CreditCard, Calendar, Receipt, Download, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  bookingId: string
  pnr: string
  amount: number
  type: 'booking' | 'cancellation' | 'refund'
  status: 'completed' | 'pending' | 'failed'
  paymentMethod: string
  transactionId: string
  date: string
  description: string
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      bookingId: '1',
      pnr: 'PNR123456',
      amount: 3990,
      type: 'booking',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN123456789',
      date: '2024-01-20T10:30:00',
      description: 'New Delhi - Mumbai Central Rajdhani Express (3A)'
    },
    {
      id: '2',
      bookingId: '2',
      pnr: 'PNR789012',
      amount: 2955,
      type: 'booking',
      status: 'completed',
      paymentMethod: 'UPI',
      transactionId: 'TXN987654321',
      date: '2024-01-25T14:15:00',
      description: 'Mumbai Central - New Delhi Rajdhani Express (2A)'
    },
    {
      id: '3',
      bookingId: '3',
      pnr: 'PNR345678',
      amount: -755,
      type: 'refund',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN456789123',
      date: '2024-01-30T16:45:00',
      description: 'Refund for Grand Trunk Express (SL) - Cancelled'
    },
    {
      id: '4',
      bookingId: '4',
      pnr: 'PNR567890',
      amount: 1895,
      type: 'booking',
      status: 'pending',
      paymentMethod: 'Net Banking',
      transactionId: 'TXN789123456',
      date: '2024-02-01T09:20:00',
      description: 'New Delhi - Amritsar Shatabdi Express (CC)'
    }
  ])

  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || transaction.type === filter
    const matchesSearch = 
      transaction.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    alert(`Downloading receipt for transaction: ${transaction.transactionId}`)
  }

  const totalSpent = transactions
    .filter(t => t.type === 'booking' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalRefunded = transactions
    .filter(t => t.type === 'refund' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
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
                      <p><strong>Transaction ID:</strong> {transaction.transactionId}</p>
                    </div>
                    <div>
                      <p><strong>Payment Method:</strong> {transaction.paymentMethod}</p>
                      <p><strong>Date:</strong> {format(new Date(transaction.date), 'MMM d, yyyy HH:mm')}</p>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
