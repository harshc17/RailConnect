# RailConnect Setup Guide

This guide will help you set up and run the RailConnect application on your local machine.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/railconnect.git
   cd railconnect
   ```

2. **Run the setup script**
   ```bash
   npm run setup
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### Option 2: Manual Setup

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- **Git** - [Download here](https://git-scm.com/)

## 🗄️ Database Setup

### 1. Install MySQL

**Windows:**
- Download MySQL Installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
- Run the installer and follow the setup wizard
- Remember your root password

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 2. Create Database

1. **Start MySQL service**
   ```bash
   # Windows
   net start mysql
   
   # macOS/Linux
   sudo systemctl start mysql
   # or
   brew services start mysql
   ```

2. **Login to MySQL**
   ```bash
   mysql -u root -p
   ```

3. **Create database and user**
   ```sql
   CREATE DATABASE railconnect;
   CREATE USER 'railconnect'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON railconnect.* TO 'railconnect'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Import database schema**
   ```bash
   mysql -u root -p railconnect < database/schema.sql
   ```

## 🔧 Backend Setup

### 1. Navigate to server directory
```bash
cd server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp env.example .env
```

Edit the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=railconnect
DB_PASSWORD=your_password
DB_NAME=railconnect
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### 4. Start the backend server
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

## 🎨 Frontend Setup

### 1. Navigate to root directory
```bash
cd ..
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the frontend development server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🚀 Running the Complete Application

### Option 1: Using the start script
```bash
npm start
```

This will start both frontend and backend servers simultaneously.

### Option 2: Manual startup

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## 🔍 Verification

### 1. Check Backend Health
Visit `http://localhost:5000/api/health`
You should see:
```json
{
  "status": "OK",
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 2. Check Frontend
Visit `http://localhost:5173`
You should see the RailConnect homepage.

### 3. Test Database Connection
The backend will automatically test the database connection on startup.

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
- Ensure MySQL is running
- Check your database credentials in `.env`
- Verify the database exists

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
- Kill the process using the port
- Change the port in `.env` file
- Restart the server

#### 3. Module Not Found
```
Error: Cannot find module 'express'
```

**Solution:**
- Run `npm install` in the server directory
- Check if `node_modules` exists
- Delete `node_modules` and `package-lock.json`, then run `npm install`

#### 4. Frontend Build Error
```
Error: Failed to compile
```

**Solution:**
- Check for TypeScript errors
- Run `npm run lint:fix`
- Clear browser cache

### Database Issues

#### 1. Schema Import Failed
```bash
# Check if the schema file exists
ls -la database/schema.sql

# Import manually
mysql -u root -p
USE railconnect;
SOURCE database/schema.sql;
```

#### 2. Permission Denied
```bash
# Grant permissions
mysql -u root -p
GRANT ALL PRIVILEGES ON railconnect.* TO 'railconnect'@'localhost';
FLUSH PRIVILEGES;
```

## 📊 Default Credentials

### Demo User Accounts
- **User**: `user@railconnect.com` / `user123`
- **Admin**: `admin@railconnect.com` / `admin123`

### Database Access
- **Host**: `localhost`
- **Port**: `3306`
- **Database**: `railconnect`
- **User**: `railconnect`
- **Password**: (as set in your `.env` file)

## 🔧 Development Tools

### Recommended VS Code Extensions
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **MySQL**
- **Thunder Client** (for API testing)
- **GitLens**

### Useful Commands

```bash
# Check database connection
mysql -u railconnect -p railconnect -e "SELECT COUNT(*) FROM users;"

# View logs
tail -f server/logs/app.log

# Reset database
mysql -u root -p -e "DROP DATABASE railconnect; CREATE DATABASE railconnect;"
mysql -u root -p railconnect < database/schema.sql

# Check running processes
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
```

## 📱 Mobile Testing

### Using Browser DevTools
1. Open Chrome DevTools (F12)
2. Click the device toggle icon
3. Select a mobile device
4. Refresh the page

### Using Real Device
1. Find your computer's IP address
2. Update the API URL in frontend
3. Access from mobile browser

## 🚀 Production Deployment

### Frontend (Vercel)
```bash
npm run build
npx vercel --prod
```

### Backend (Railway)
```bash
cd server
railway login
railway deploy
```

### Database (PlanetScale/MySQL)
1. Create production database
2. Import schema
3. Update connection strings

## 📞 Support

If you encounter any issues:

1. **Check the logs** in the terminal
2. **Verify all prerequisites** are installed
3. **Check the troubleshooting section** above
4. **Create an issue** on GitHub
5. **Contact support** at support@railconnect.com

## 🎯 Next Steps

Once the application is running:

1. **Explore the features** using demo accounts
2. **Test the booking flow** end-to-end
3. **Check the admin dashboard** for analytics
4. **Customize the application** for your needs
5. **Deploy to production** when ready

---

**Happy coding! 🚀**
