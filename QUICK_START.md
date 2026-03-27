# RailConnect - Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server running
- Database `railconnect` created (run `database/railconnect.sql`)

## Setup (First Time Only)

1. **Install dependencies:**
   ```bash
   npm run setup
   ```

2. **Configure database:**
   - Copy `server/env.example` to `server/.env`
   - Update database credentials in `server/.env`:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=railconnect
     PORT=5000
     NODE_ENV=development
     ```

3. **Create database:**
   - Import `database/railconnect.sql` into MySQL
   - Or run: `mysql -u root -p < database/railconnect.sql`

## Running the Application

### Option 1: Start Both Servers Together (Recommended)
```bash
npm start
```
This starts both backend (port 5000) and frontend (port 3000) servers.

### Option 2: Start Servers Separately

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
Backend runs on: http://localhost:5000

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```
Frontend runs on: http://localhost:3000

## Default Login Credentials

After first setup, default accounts are created:
- **Admin:** `admin@railconnect.com` / `admin123`
- **Test User:** `user@railconnect.com` / `user123`

## Important Notes

✅ **Data Persistence:** All user data, bookings, and transactions are now saved permanently in MySQL. Data will NOT be deleted when you close the terminal or restart the server.

✅ **Database:** Make sure MySQL is running before starting the backend server.

✅ **Ports:** 
- Backend: 5000
- Frontend: 3000 (Vite default)

## Troubleshooting

**Error: ECONNREFUSED**
- Make sure the backend server is running on port 5000
- Check if MySQL is running
- Verify database credentials in `server/.env`

**Error: Database connection failed**
- Ensure MySQL server is running
- Check database credentials in `server/.env`
- Verify database `railconnect` exists

**Port already in use**
- Stop other applications using ports 3000 or 5000
- Or change ports in `vite.config.ts` and `server/.env`

