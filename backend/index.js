const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Root@123',
  database: process.env.DB_NAME || 'railconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

const pool = mysql.createPool(dbConfig)

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// --- Seeding function for development ---
// This function only creates default accounts if they don't exist
// It does NOT delete existing data - all user data persists permanently
const seedDatabase = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Skipping database seeding in non-development environment.');
    return;
  }

  console.log('Checking for default accounts...');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if admin account exists
    const [adminUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@railconnect.com', 'admin']
    );

    // Create Admin Account only if it doesn't exist
    if (adminUsers.length === 0) {
      console.log('Creating default admin account...');
      const adminPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        ['Admin User', 'admin@railconnect.com', '', adminPassword, 'admin']
      );
      console.log('Default admin account created: admin@railconnect.com / admin123');
    } else {
      console.log('Admin account already exists, skipping creation.');
    }

    // Check if test user account exists
    const [testUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['user@railconnect.com', 'user']
    );

    // Create Test User Account only if it doesn't exist
    if (testUsers.length === 0) {
      console.log('Creating default test user account...');
      const userPassword = await bcrypt.hash('user123', 10);
      await connection.execute(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        ['Test User', 'user@railconnect.com', '', userPassword, 'user']
      );
      console.log('Default test user account created: user@railconnect.com / user123');
    } else {
      console.log('Test user account already exists, skipping creation.');
    }

    await connection.commit();
    console.log('Database seeding check completed. All existing data preserved.');
  } catch (error) {
    await connection.rollback();
    console.error('Database seeding failed:', error);
  } finally {
    connection.release();
  }
};

// Run seeding on startup (only creates missing default accounts, never deletes data)
seedDatabase().catch(err => console.error("Error during initial seeding:", err));
// --- End of Seeding ---

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Routes

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email: rawEmail, phone: rawPhone, password } = req.body
    const email = rawEmail ? rawEmail.trim().toLowerCase() : ''
    const phone = rawPhone || '' // Default to empty string if undefined or null
    console.log('Register attempt:', { name, email, phone: rawPhone, password: '[REDACTED]' })

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Check if user already exists (case-insensitive)
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(email) = ?',
      [email]
    )

    if (existingUser.length > 0) {
      console.log('Registration failed: User already exists for email', email)
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Hashed password:', hashedPassword)

    // Create user (store email in lowercase)
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, 'user']
    )

    const userId = result.insertId
    console.log('User registered with ID:', userId)

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, name, email, role: 'user' }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email: rawEmail, password, role = 'user' } = req.body
    const email = rawEmail ? rawEmail.trim().toLowerCase() : ''
    console.log('Login attempt:', { email, password: '[REDACTED]', role, originalEmail: rawEmail })

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user (case-insensitive email search)
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(email) = ? AND role = ?',
      [email, role]
    )

    if (users.length === 0) {
      console.log('Login failed: User not found for email', email, 'and role', role)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = users[0]
    console.log('User found:', { id: user.id, email: user.email, role: user.role })

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('Password comparison result:', isValidPassword)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    )

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Train Routes
app.get('/api/trains', async (req, res) => {
  try {
    const { from, to, date } = req.query

    let query = `
      SELECT t.*, tc.class_code, tc.class_name, tc.base_price, tc.available_seats
      FROM trains t
      JOIN train_classes tc ON t.id = tc.train_id
      WHERE t.status = 'active'
    `
    const params = []

    if (from && to) {
      query += ' AND t.from_station = ? AND t.to_station = ?'
      params.push(from, to)
    }

    query += ' ORDER BY t.departure_time'

    const [trains] = await pool.execute(query, params)

    // Group trains by train ID
    const groupedTrains = {}
    trains.forEach(train => {
      if (!groupedTrains[train.id]) {
        groupedTrains[train.id] = {
          id: train.id,
          number: train.number,
          name: train.name,
          from_station: train.from_station,
          to_station: train.to_station,
          departure_time: train.departure_time,
          arrival_time: train.arrival_time,
          duration: train.duration,
          type: train.type,
          zone: train.zone,
          distance: train.distance,
          classes: {}
        }
      }
      groupedTrains[train.id].classes[train.class_code] = {
        name: train.class_name,
        price: train.base_price,
        available: train.available_seats
      }
    })

    res.json(Object.values(groupedTrains))
  } catch (error) {
    console.error('Get trains error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/trains/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [trains] = await pool.execute(
      'SELECT * FROM trains WHERE id = ? AND status = "active"',
      [id]
    )

    if (trains.length === 0) {
      return res.status(404).json({ error: 'Train not found' })
    }

    const [classes] = await pool.execute(
      'SELECT * FROM train_classes WHERE train_id = ?',
      [id]
    )

    const train = trains[0]
    train.classes = {}
    classes.forEach(cls => {
      train.classes[cls.class_code] = {
        name: cls.class_name,
        price: cls.base_price,
        available: cls.available_seats
      }
    })

    res.json(train)
  } catch (error) {
    console.error('Get train error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Station Routes
app.get('/api/stations', async (req, res) => {
  try {
    const { search } = req.query

    let query = 'SELECT * FROM railway_stations'
    const params = []

    if (search) {
      query += ' WHERE name LIKE ? OR code LIKE ?'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY name'

    const [stations] = await pool.execute(query, params)
    res.json(stations)
  } catch (error) {
    console.error('Get stations error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Booking Routes
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { trainId, journeyDate, classCode, passengers, totalAmount, paymentMethod } = req.body
    const userId = req.user.id

    // Generate PNR
    const pnr = 'PNR' + Math.random().toString(36).substr(2, 6).toUpperCase()

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    // --- Seat Allocation Logic ---
    const allocatedPassengers = []
    let seatCounter = 1 // A simple counter for seat allocation

    // A very basic preference-based allocation
    const allocateSeat = (preference) => {
      const seatNumber = seatCounter++
      let berthType = ''
      
      // Simple logic to assign berth type based on preference and seat number
      const seatMod = seatNumber % 8
      if (preference === 'Lower' || preference === 'Side Lower') {
        berthType = (seatMod === 1 || seatMod === 4) ? 'L' : (seatMod === 7) ? 'SL' : 'L'
      } else if (preference === 'Middle') {
        berthType = (seatMod === 2 || seatMod === 5) ? 'M' : 'M'
      } else if (preference === 'Upper' || preference === 'Side Upper') {
        berthType = (seatMod === 3 || seatMod === 6) ? 'U' : (seatMod === 0) ? 'SU' : 'U'
      } else { // No preference
        const berths = ['L', 'M', 'U', 'L', 'M', 'U', 'SL', 'SU']
        berthType = berths[seatMod]
      }
      return `${Math.ceil(seatNumber / 8)}-${seatNumber}${berthType}`
    }

    for (const passenger of passengers) {
      const seatNumber = allocateSeat(passenger.berthPreference)
      allocatedPassengers.push({
        ...passenger,
        seat_number: seatNumber,
      })
    }
    // --- End Seat Allocation Logic ---

    try {
      // Create booking
      const [bookingResult] = await connection.execute(
        `INSERT INTO bookings (pnr, user_id, train_id, journey_date, class_code, total_passengers, total_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
        [pnr, userId, trainId, journeyDate, classCode, passengers.length, totalAmount]
      )

      const bookingId = bookingResult.insertId

      // Add passengers
      for (const passenger of allocatedPassengers) {
        await connection.execute(
          `INSERT INTO passengers (booking_id, name, age, gender, berth_preference, seat_number)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [bookingId, passenger.name, passenger.age, passenger.gender, passenger.berthPreference, passenger.seat_number]
        )
      }

      // Create transaction record
      const transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()
      await connection.execute(
        `INSERT INTO transactions (booking_id, transaction_id, amount, type, status, payment_method)
         VALUES (?, ?, ?, 'booking', 'completed', ?)`,
        [bookingId, transactionId, totalAmount, paymentMethod]
      )

      // Update seat availability
      await connection.execute(
        `UPDATE train_classes 
         SET available_seats = available_seats - ? 
         WHERE train_id = ? AND class_code = ?`,
        [passengers.length, trainId, classCode]
      )

      await connection.commit()

      res.status(201).json({
        message: 'Booking created successfully',
        booking: {
          id: bookingId,
          pnr,
          transactionId,
          passengers: allocatedPassengers,
        }
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const [bookings] = await pool.execute(
      `SELECT b.*, t.name as train_name, t.number as train_number, t.from_station, t.to_station,
              t.departure_time, t.arrival_time
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    )

    // Get passengers for each booking
    for (const booking of bookings) {
      const [passengers] = await pool.execute(
        'SELECT * FROM passengers WHERE booking_id = ?',
        [booking.id]
      )
      booking.passengers = passengers
    }

    res.json(bookings)
  } catch (error) {
    console.error('Get bookings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const [transactions] = await pool.execute(
      `SELECT 
        tr.id,
        tr.booking_id,
        tr.transaction_id,
        tr.amount,
        tr.type,
        tr.status,
        tr.payment_method,
        tr.created_at,
        b.pnr,
        b.class_code,
        b.journey_date,
        b.total_passengers,
        t.name as train_name,
        t.number as train_number,
        t.from_station,
        t.to_station
       FROM transactions tr
       JOIN bookings b ON tr.booking_id = b.id
       JOIN trains t ON b.train_id = t.id
       WHERE b.user_id = ?
       ORDER BY tr.created_at DESC`,
      [userId]
    )

    res.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/pnr-status/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params

    const [bookings] = await pool.execute(
      `SELECT b.*, t.name as train_name, t.number as train_number, t.from_station, t.to_station,
              t.departure_time, t.arrival_time
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       WHERE b.pnr = ?`,
      [pnr]
    )

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'PNR not found' })
    }

    const booking = bookings[0]

    const [passengers] = await pool.execute(
      'SELECT * FROM passengers WHERE booking_id = ?',
      [booking.id]
    )
    booking.passengers = passengers

    res.json(booking)
  } catch (error) {
    console.error('Get PNR status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Check if booking exists and belongs to user
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookings[0]

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' })
    }

    // Calculate refund amount (deduct ₹200 penalty)
    const PENALTY_CHARGE = 200
    const refundAmount = Math.max(0, booking.total_amount - PENALTY_CHARGE)

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Update booking status
      await connection.execute(
        'UPDATE bookings SET status = "cancelled" WHERE id = ?',
        [id]
      )

      // Create refund transaction with penalty deducted
      const transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()
      
      // Get the original payment method from the booking transaction
      const [originalTransactions] = await connection.execute(
        `SELECT payment_method FROM transactions 
         WHERE booking_id = ? AND type = 'booking' 
         ORDER BY created_at DESC LIMIT 1`,
        [id]
      )
      
      const paymentMethod = originalTransactions.length > 0 
        ? originalTransactions[0].payment_method 
        : 'Credit Card'

      await connection.execute(
        `INSERT INTO transactions (booking_id, transaction_id, amount, type, status, payment_method)
         VALUES (?, ?, ?, 'refund', 'completed', ?)`,
        [id, transactionId, refundAmount, paymentMethod]
      )

      // Update seat availability
      await connection.execute(
        `UPDATE train_classes 
         SET available_seats = available_seats + ? 
         WHERE train_id = ? AND class_code = ?`,
        [booking.total_passengers, booking.train_id, booking.class_code]
      )

      await connection.commit()

      res.json({ 
        message: 'Booking cancelled successfully',
        refundAmount,
        penaltyCharge: PENALTY_CHARGE,
        transactionId
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Cancel booking error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete Account Route
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  let connection
  try {
    const userId = req.user.id
    console.log('Delete account request for user:', userId, 'role:', req.user.role)
    
    // Prevent admin accounts from being deleted
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be deleted' })
    }

    connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Get all bookings for this user
      const [bookings] = await connection.execute(
        'SELECT id, train_id, class_code, total_passengers, status FROM bookings WHERE user_id = ?',
        [userId]
      )

      console.log(`Found ${bookings.length} bookings for user ${userId}`)

      // Cancel all active bookings and restore seat availability
      for (const booking of bookings) {
        if (booking.status === 'confirmed' || booking.status === 'waiting') {
          // Restore seat availability
          await connection.execute(
            `UPDATE train_classes 
             SET available_seats = available_seats + ? 
             WHERE train_id = ? AND class_code = ?`,
            [booking.total_passengers, booking.train_id, booking.class_code]
          )
          console.log(`Restored ${booking.total_passengers} seats for train ${booking.train_id}, class ${booking.class_code}`)
        }
        
        // Update booking status to cancelled
        await connection.execute(
          'UPDATE bookings SET status = "cancelled" WHERE id = ?',
          [booking.id]
        )
      }

      // Delete all transactions associated with user's bookings
      const bookingIds = bookings.map(b => b.id)
      if (bookingIds.length > 0) {
        const [transactionResult] = await connection.execute(
          `DELETE FROM transactions WHERE booking_id IN (${bookingIds.map(() => '?').join(',')})`,
          bookingIds
        )
        console.log(`Deleted ${transactionResult.affectedRows} transactions`)
      }

      // Delete all passengers associated with user's bookings
      if (bookingIds.length > 0) {
        const [passengerResult] = await connection.execute(
          `DELETE FROM passengers WHERE booking_id IN (${bookingIds.map(() => '?').join(',')})`,
          bookingIds
        )
        console.log(`Deleted ${passengerResult.affectedRows} passengers`)
      }

      // Delete all bookings
      const [bookingResult] = await connection.execute('DELETE FROM bookings WHERE user_id = ?', [userId])
      console.log(`Deleted ${bookingResult.affectedRows} bookings`)

      // Finally, delete the user account
      const [userResult] = await connection.execute('DELETE FROM users WHERE id = ?', [userId])
      console.log(`Deleted user account. Affected rows: ${userResult.affectedRows}`)

      if (userResult.affectedRows === 0) {
        throw new Error('User account not found or already deleted')
      }

      await connection.commit()
      console.log('Account deletion completed successfully for user:', userId)

      res.json({ message: 'Account deleted successfully' })
    } catch (error) {
      await connection.rollback()
      console.error('Transaction rollback due to error:', error)
      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  } catch (error) {
    console.error('Delete account error:', error)
    const errorMessage = error.message || 'Internal server error'
    res.status(500).json({ error: errorMessage })
  }
})

// Admin Routes
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"')
    const [trainCount] = await pool.execute('SELECT COUNT(*) as count FROM trains WHERE status = "active"')
    const [bookingCount] = await pool.execute('SELECT COUNT(*) as count FROM bookings')
    const [revenueResult] = await pool.execute(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "booking" AND status = "completed"'
    )

    res.json({
      totalUsers: userCount[0].count,
      totalTrains: trainCount[0].count,
      totalBookings: bookingCount[0].count,
      totalRevenue: revenueResult[0].total || 0
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/admin/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      [userCount],
      [trainCount],
      [bookingCount],
      [revenueResult]
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "user"'),
      pool.execute('SELECT COUNT(*) as count FROM trains WHERE status = "active"'),
      pool.execute('SELECT COUNT(*) as count FROM bookings'),
      pool.execute(
        'SELECT SUM(amount) as total FROM transactions WHERE type = "booking" AND status = "completed"'
      )
    ])

    const [[currentPeriod]] = await pool.execute(
      `SELECT 
         COUNT(*) AS bookings,
         COALESCE(SUM(total_amount), 0) AS revenue
       FROM bookings
       WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         AND status IN ('confirmed', 'completed')`
    )

    const [[previousPeriod]] = await pool.execute(
      `SELECT 
         COUNT(*) AS bookings,
         COALESCE(SUM(total_amount), 0) AS revenue
       FROM bookings
       WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
         AND booking_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         AND status IN ('confirmed', 'completed')`
    )

    const [[userGrowthResult]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS current,
         SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) 
                   AND created_at < DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS previous
       FROM users
       WHERE role = 'user'`
    )

    const calcGrowth = (currentValue, previousValue) => {
      if (!previousValue || previousValue === 0) {
        return currentValue > 0 ? 100 : 0
      }
      return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(2))
    }

    const totalUsers = Number(userCount[0].count || 0)
    const totalTrains = Number(trainCount[0].count || 0)
    const totalBookings = Number(bookingCount[0].count || 0)
    const totalRevenue = Number(revenueResult[0].total || 0)
    const currentBookings = Number(currentPeriod.bookings || 0)
    const previousBookings = Number(previousPeriod.bookings || 0)
    const currentRevenue = Number(currentPeriod.revenue || 0)
    const previousRevenue = Number(previousPeriod.revenue || 0)
    const currentUsers = Number(userGrowthResult.current || 0)
    const previousUsers = Number(userGrowthResult.previous || 0)

    const stats = {
      totalUsers,
      totalTrains,
      totalBookings,
      totalRevenue,
      monthlyGrowth: calcGrowth(currentBookings, previousBookings),
      bookingGrowth: calcGrowth(currentBookings, previousBookings),
      revenueGrowth: calcGrowth(currentRevenue, previousRevenue),
      userGrowth: calcGrowth(currentUsers, previousUsers)
    }

    const [recentBookings] = await pool.execute(
      `SELECT 
         b.id,
         b.pnr,
         t.name AS trainName,
         CONCAT(t.from_station, ' - ', t.to_station) AS route,
         DATE_FORMAT(b.journey_date, '%Y-%m-%d') AS date,
         b.total_amount AS amount,
         b.status
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       ORDER BY b.booking_date DESC
       LIMIT 6`
    )

    const [popularRoutes] = await pool.execute(
      `SELECT 
         t.from_station AS fromStation,
         t.to_station AS toStation,
         CONCAT(t.from_station, ' - ', t.to_station) AS route,
         COUNT(*) AS bookings,
         COALESCE(SUM(b.total_amount), 0) AS revenue
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       WHERE b.status IN ('confirmed', 'completed')
       GROUP BY t.from_station, t.to_station
       ORDER BY bookings DESC
       LIMIT 5`
    )

    const [trainPerformance] = await pool.execute(
      `SELECT 
         t.id,
         t.name,
         t.number,
         COALESCE(SUM(tc.total_seats), 0) AS total_seats,
         COALESCE(SUM(tc.available_seats), 0) AS available_seats,
         COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.total_amount ELSE 0 END), 0) AS revenue,
         COUNT(DISTINCT CASE WHEN b.status IN ('confirmed','completed') THEN b.id END) AS booking_count
       FROM trains t
       LEFT JOIN train_classes tc ON t.id = tc.train_id
       LEFT JOIN bookings b ON t.id = b.train_id
       WHERE t.status = 'active'
       GROUP BY t.id, t.name, t.number
       ORDER BY booking_count DESC, revenue DESC
       LIMIT 5`
    )

    const performance = trainPerformance.map(train => {
      const occupancy = train.total_seats
        ? Math.round(((train.total_seats - train.available_seats) / train.total_seats) * 100)
        : 0
      const ratingBase = Math.min(5, 3 + (train.booking_count || 0) / 10)
      const rating = Number(ratingBase.toFixed(1))
      return {
        train: `${train.name}`,
        trainNumber: train.number,
        occupancy,
        revenue: Number(train.revenue),
        rating
      }
    })

    const recent = recentBookings.map(booking => ({
      ...booking,
      amount: Number(booking.amount || 0)
    }))

    const routes = popularRoutes.map(route => ({
      ...route,
      bookings: Number(route.bookings || 0),
      revenue: Number(route.revenue || 0)
    }))

    res.json({
      stats,
      recentBookings: recent,
      popularRoutes: routes,
      trainPerformance: performance
    })
  } catch (error) {
    console.error('Get admin overview error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.phone,
         u.role,
         u.status,
         u.created_at AS createdAt,
         u.last_login AS lastLogin,
         COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN 1 ELSE 0 END), 0) AS totalBookings,
         COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN b.total_amount ELSE 0 END), 0) AS totalSpent
       FROM users u
       LEFT JOIN bookings b ON u.id = b.user_id
       GROUP BY u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at, u.last_login
       ORDER BY u.created_at DESC`
    )

    res.json(users)
  } catch (error) {
    console.error('Get admin users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { status, role } = req.body

  if (!status && !role) {
    return res.status(400).json({ error: 'No updates provided' })
  }

  try {
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ error: 'Admins cannot modify their own role or status' })
    }

    const updates = []
    const params = []

    if (status) {
      updates.push('status = ?')
      params.push(status)
    }

    if (role) {
      updates.push('role = ?')
      params.push(role)
    }

    params.push(id)

    const [result] = await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Update admin user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params

  try {
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ error: 'Admins cannot delete their own account' })
    }

    const [userRows] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    )

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (userRows[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete another admin account' })
    }

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const [bookings] = await connection.execute(
        'SELECT id, train_id, class_code, total_passengers, status FROM bookings WHERE user_id = ?',
        [id]
      )

      if (bookings.length > 0) {
        const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'waiting')

        for (const booking of activeBookings) {
          await connection.execute(
            `UPDATE train_classes
             SET available_seats = available_seats + ?
             WHERE train_id = ? AND class_code = ?`,
            [booking.total_passengers, booking.train_id, booking.class_code]
          )
        }

        await connection.execute(
          `DELETE FROM transactions WHERE booking_id IN (${bookings.map(() => '?').join(',')})`,
          bookings.map(b => b.id)
        )

        await connection.execute(
          `DELETE FROM passengers WHERE booking_id IN (${bookings.map(() => '?').join(',')})`,
          bookings.map(b => b.id)
        )

        await connection.execute(
          'DELETE FROM bookings WHERE user_id = ?',
          [id]
        )
      }

      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      )

      await connection.commit()

      res.json({ message: 'User deleted successfully' })
    } catch (error) {
      await connection.rollback()
      console.error('Delete admin user transaction error:', error)
      res.status(500).json({ error: 'Internal server error' })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Delete admin user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500)
    const offset = parseInt(req.query.offset, 10) || 0

    const [bookings] = await pool.execute(
      `SELECT 
         b.id,
         b.pnr,
         b.user_id AS userId,
         u.name AS userName,
         u.email AS userEmail,
         b.train_id AS trainId,
         t.name AS trainName,
         t.number AS trainNumber,
         t.from_station AS fromStation,
         t.to_station AS toStation,
         DATE_FORMAT(b.journey_date, '%Y-%m-%d') AS journeyDate,
         DATE_FORMAT(b.booking_date, '%Y-%m-%dT%H:%i:%sZ') AS bookingDate,
         t.departure_time AS departureTime,
         t.arrival_time AS arrivalTime,
         b.class_code AS classCode,
         b.total_passengers AS totalPassengers,
         b.total_amount AS totalAmount,
         b.status
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN trains t ON b.train_id = t.id
       ORDER BY b.booking_date DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    const bookingIds = bookings.map(b => b.id)

    let passengersByBooking = {}
    let paymentStatusByBooking = {}

    if (bookingIds.length > 0) {
      const placeholders = bookingIds.map(() => '?').join(',')

      const [passengers] = await pool.execute(
        `SELECT 
           booking_id AS bookingId,
           name,
           age,
           gender,
           berth_preference AS berthPreference,
           seat_number AS seatNumber
         FROM passengers
         WHERE booking_id IN (${placeholders})`,
        bookingIds
      )

      passengersByBooking = passengers.reduce((acc, passenger) => {
        if (!acc[passenger.bookingId]) {
          acc[passenger.bookingId] = []
        }
        acc[passenger.bookingId].push(passenger)
        return acc
      }, {})

      const [transactions] = await pool.execute(
        `SELECT booking_id AS bookingId, status
         FROM transactions
         WHERE booking_id IN (${placeholders})
         AND type = 'booking'
         ORDER BY created_at DESC`,
        bookingIds
      )

      paymentStatusByBooking = transactions.reduce((acc, txn) => {
        if (!acc[txn.bookingId]) {
          acc[txn.bookingId] = txn.status
        }
        return acc
      }, {})
    }

    const response = bookings.map(booking => ({
      ...booking,
      passengers: passengersByBooking[booking.id] || [],
      paymentStatus: paymentStatusByBooking[booking.id] || 'pending'
    }))

    res.json(response)
  } catch (error) {
    console.error('Get admin bookings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/admin/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const [bookings] = await pool.execute(
      `SELECT 
         b.id,
         b.pnr,
         b.user_id AS userId,
         u.name AS userName,
         u.email AS userEmail,
         u.phone AS userPhone,
         b.train_id AS trainId,
         t.name AS trainName,
         t.number AS trainNumber,
         t.from_station AS fromStation,
         t.to_station AS toStation,
         DATE_FORMAT(b.journey_date, '%Y-%m-%d') AS journeyDate,
         DATE_FORMAT(b.booking_date, '%Y-%m-%dT%H:%i:%sZ') AS bookingDate,
         t.departure_time AS departureTime,
         t.arrival_time AS arrivalTime,
         t.duration,
         b.class_code AS classCode,
         b.total_passengers AS totalPassengers,
         b.total_amount AS totalAmount,
         b.status
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN trains t ON b.train_id = t.id
       WHERE b.id = ?`,
      [id]
    )

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookings[0]

    const [passengers] = await pool.execute(
      `SELECT 
         id,
         name,
         age,
         gender,
         berth_preference AS berthPreference,
         seat_number AS seatNumber
       FROM passengers
       WHERE booking_id = ?`,
      [id]
    )

    const [transactions] = await pool.execute(
      `SELECT 
         id,
         transaction_id AS transactionId,
         amount,
         type,
         status,
         payment_method AS paymentMethod,
         DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS createdAt
       FROM transactions
       WHERE booking_id = ?
       ORDER BY created_at DESC`,
      [id]
    )

    res.json({
      ...booking,
      passengers: passengers || [],
      transactions: transactions || [],
      paymentStatus: transactions.length > 0 && transactions[0].type === 'booking' 
        ? transactions[0].status 
        : 'pending'
    })
  } catch (error) {
    console.error('Get booking details error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.patch('/api/admin/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const validStatuses = ['confirmed', 'waiting', 'cancelled', 'completed']
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid booking status' })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [bookings] = await connection.execute(
      'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
      [id]
    )

    if (bookings.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookings[0]

    if (booking.status === status) {
      await connection.rollback()
      return res.json({ message: 'Booking status unchanged' })
    }

    if (status === 'cancelled' && booking.status !== 'cancelled') {
      await connection.execute(
        `UPDATE train_classes 
         SET available_seats = available_seats + ? 
         WHERE train_id = ? AND class_code = ?`,
        [booking.total_passengers, booking.train_id, booking.class_code]
      )

      const [existingRefund] = await connection.execute(
        `SELECT id FROM transactions 
         WHERE booking_id = ? AND type = 'refund'`,
        [id]
      )

      if (existingRefund.length === 0) {
        const penaltyCharge = 200
        const refundAmount = Math.max(0, booking.total_amount - penaltyCharge)
        const transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()

        const [originalTransaction] = await connection.execute(
          `SELECT payment_method FROM transactions
           WHERE booking_id = ? AND type = 'booking'
           ORDER BY created_at DESC LIMIT 1`,
          [id]
        )

        const paymentMethod = originalTransaction.length > 0
          ? originalTransaction[0].payment_method
          : 'Credit Card'

        await connection.execute(
          `INSERT INTO transactions (booking_id, transaction_id, amount, type, status, payment_method)
           VALUES (?, ?, ?, 'refund', 'completed', ?)`,
          [id, transactionId, refundAmount, paymentMethod]
        )
      }
    }

    if (status === 'confirmed' && booking.status === 'waiting') {
      await connection.execute(
        `UPDATE train_classes
         SET available_seats = CASE 
           WHEN available_seats >= ? THEN available_seats - ?
           ELSE available_seats
         END
         WHERE train_id = ? AND class_code = ?`,
        [booking.total_passengers, booking.total_passengers, booking.train_id, booking.class_code]
      )
    }

    await connection.execute(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    )

    await connection.commit()

    res.json({ message: 'Booking status updated successfully' })
  } catch (error) {
    await connection.rollback()
    console.error('Update booking status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    connection.release()
  }
})

app.get('/api/admin/trains', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [trains] = await pool.execute(
      `SELECT 
         id,
         number,
         name,
         from_station AS fromStation,
         to_station AS toStation,
         departure_time AS departureTime,
         arrival_time AS arrivalTime,
         duration,
         days,
         type,
         zone,
         distance,
         status
       FROM trains
       ORDER BY name`
    )

    const trainIds = trains.map(t => t.id)
    let classesByTrain = {}

    if (trainIds.length > 0) {
      const placeholders = trainIds.map(() => '?').join(',')
      const [classes] = await pool.execute(
        `SELECT 
           train_id,
           class_code,
           class_name,
           base_price,
           total_seats,
           available_seats
         FROM train_classes
         WHERE train_id IN (${placeholders})
         ORDER BY class_code`,
        trainIds
      )

      classesByTrain = classes.reduce((acc, cls) => {
        if (!acc[cls.train_id]) {
          acc[cls.train_id] = []
        }
        acc[cls.train_id].push({
          classCode: cls.class_code,
          className: cls.class_name,
          basePrice: Number(cls.base_price),
          totalSeats: cls.total_seats,
          availableSeats: cls.available_seats
        })
        return acc
      }, {})
    }

    const response = trains.map(train => ({
      ...train,
      days: Array.isArray(train.days) ? train.days : JSON.parse(train.days || '[]'),
      classes: classesByTrain[train.id] || []
    }))

    res.json(response)
  } catch (error) {
    console.error('Get admin trains error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/admin/trains/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const [trains] = await pool.execute(
      `SELECT 
         id,
         number,
         name,
         from_station AS fromStation,
         to_station AS toStation,
         departure_time AS departureTime,
         arrival_time AS arrivalTime,
         duration,
         days,
         type,
         zone,
         distance,
         status
       FROM trains
       WHERE id = ?`,
      [id]
    )

    if (trains.length === 0) {
      return res.status(404).json({ error: 'Train not found' })
    }

    const train = trains[0]
    const [classes] = await pool.execute(
      `SELECT 
         id,
         class_code AS classCode,
         class_name AS className,
         base_price AS basePrice,
         total_seats AS totalSeats,
         available_seats AS availableSeats
       FROM train_classes
       WHERE train_id = ?
       ORDER BY class_code`,
      [id]
    )

    res.json({
      ...train,
      days: Array.isArray(train.days) ? train.days : JSON.parse(train.days || '[]'),
      classes: classes.map(cls => ({
        ...cls,
        basePrice: Number(cls.basePrice),
        totalSeats: Number(cls.totalSeats),
        availableSeats: Number(cls.availableSeats)
      }))
    })
  } catch (error) {
    console.error('Get train details error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/admin/trains/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()

    const {
      number,
      name,
      fromStation,
      toStation,
      departureTime,
      arrivalTime,
      duration,
      days,
      type,
      zone,
      distance,
      status
    } = req.body

    // Validate required fields
    if (!number || !name || !fromStation || !toStation || !departureTime || !arrivalTime || !duration || !type || !zone || !distance) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if train exists
    const [existing] = await connection.execute('SELECT id FROM trains WHERE id = ?', [id])
    if (existing.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Train not found' })
    }

    // Update train
    await connection.execute(
      `UPDATE trains SET
         number = ?,
         name = ?,
         from_station = ?,
         to_station = ?,
         departure_time = ?,
         arrival_time = ?,
         duration = ?,
         days = ?,
         type = ?,
         zone = ?,
         distance = ?,
         status = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        number,
        name,
        fromStation,
        toStation,
        departureTime,
        arrivalTime,
        duration,
        JSON.stringify(Array.isArray(days) ? days : days.split(',')),
        type,
        zone,
        distance,
        status || 'active',
        id
      ]
    )

    await connection.commit()
    res.json({ message: 'Train updated successfully' })
  } catch (error) {
    await connection.rollback()
    console.error('Update train error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    connection.release()
  }
})

app.put('/api/admin/trains/:id/classes', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { classes } = req.body
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    // Validate classes array
    if (!Array.isArray(classes)) {
      await connection.rollback()
      return res.status(400).json({ error: 'Classes must be an array' })
    }

    // Check if train exists
    const [existing] = await connection.execute('SELECT id FROM trains WHERE id = ?', [id])
    if (existing.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Train not found' })
    }

    // Delete existing classes
    await connection.execute('DELETE FROM train_classes WHERE train_id = ?', [id])

    // Insert new classes
    for (const cls of classes) {
      if (!cls.classCode || !cls.className || cls.basePrice === undefined || cls.totalSeats === undefined) {
        await connection.rollback()
        return res.status(400).json({ error: 'Invalid class data' })
      }

      const availableSeats = cls.availableSeats !== undefined 
        ? Math.min(cls.availableSeats, cls.totalSeats)
        : cls.totalSeats

      await connection.execute(
        `INSERT INTO train_classes (train_id, class_code, class_name, base_price, total_seats, available_seats)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, cls.classCode, cls.className, cls.basePrice, cls.totalSeats, availableSeats]
      )
    }

    await connection.commit()
    res.json({ message: 'Train classes updated successfully' })
  } catch (error) {
    await connection.rollback()
    console.error('Update train classes error:', error)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    connection.release()
  }
})

app.patch('/api/admin/trains/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const validStatuses = ['active', 'inactive', 'maintenance']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid train status' })
  }

  try {
    const [result] = await pool.execute(
      'UPDATE trains SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Train not found' })
    }

    res.json({ message: 'Train status updated successfully' })
  } catch (error) {
    console.error('Update train status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// DB Health check
app.get('/api/health/db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'OK', message: 'Database connection successful' });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Database connection failed', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
