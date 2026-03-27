# RailConnect - IRCTC-Style Train Reservation System

A modern, full-stack train reservation web application inspired by IRCTC, built with React, Node.js, and MySQL.

## 🚀 Features

### User Features
- **User Authentication**: Secure login/registration system
- **Train Search**: Search trains by route, date, and class
- **Booking System**: Complete booking flow with seat selection
- **Booking Management**: View, cancel, and download tickets
- **Transaction History**: Track all payments and refunds
- **Responsive Design**: Works on desktop and mobile devices

### Admin Features
- **Dashboard Analytics**: Comprehensive system statistics
- **Train Management**: Add, edit, and manage train schedules
- **User Management**: Manage user accounts and permissions
- **Booking Management**: Oversee all bookings and transactions
- **Real-time Updates**: Live data synchronization

### Technical Features
- **Real-time Search**: Fast train search with filters
- **PDF Ticket Generation**: Download tickets as PDF
- **Email Notifications**: Booking confirmations and updates
- **Secure Payments**: Integration with payment gateways
- **Database Optimization**: Efficient queries and indexing

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Date-fns** for date handling
- **jsPDF** for PDF generation

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Database
- **MySQL** with comprehensive schema
- **200+ Railway Stations** across India
- **Real train data** as of October 2024
- **Optimized indexes** for performance

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/railconnect.git
   cd railconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

4. **Setup MySQL database**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE railconnect;
   
   # Import schema
   mysql -u root -p railconnect < database/schema.sql
   ```

5. **Start server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

The application uses a comprehensive MySQL schema with the following main tables:

- **users**: User accounts and authentication
- **railway_stations**: 200+ major railway stations
- **trains**: Train schedules and routes
- **train_classes**: Class-wise pricing and availability
- **bookings**: Reservation records
- **passengers**: Passenger details
- **transactions**: Payment and refund records
- **seat_availability**: Real-time seat tracking

## 🚂 Train Data

The application includes comprehensive train data:

- **30+ Real Trains** from Indian Railways
- **Rajdhani, Shatabdi, Duronto, Express** trains
- **All major routes** across India
- **Real pricing** and schedules
- **Multiple classes** (1A, 2A, 3A, SL, CC, EC)

## 🎨 UI/UX Features

### IRCTC-Inspired Design
- **Blue and white** color scheme
- **Professional layout** similar to IRCTC
- **Responsive design** for all devices
- **Intuitive navigation** and user flow

### Modern Components
- **Modal dialogs** for login/registration
- **Interactive forms** with validation
- **Real-time search** with autocomplete
- **Data tables** with sorting and filtering
- **Progress indicators** and loading states

## 🔐 Security Features

- **JWT Authentication** with secure tokens
- **Password hashing** with bcrypt
- **Input validation** and sanitization
- **SQL injection** prevention
- **CORS** configuration
- **Rate limiting** for API endpoints

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:

- **Desktop** (1024px and above)
- **Tablet** (768px - 1023px)
- **Mobile** (320px - 767px)

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npx vercel --prod
   ```

### Backend Deployment (Railway/Heroku)

1. **Configure environment variables**
2. **Deploy to Railway**
   ```bash
   railway login
   railway deploy
   ```

### Database Deployment

1. **Setup MySQL on cloud provider**
2. **Import schema and data**
3. **Configure connection strings**

## 🧪 Testing

### Frontend Testing
```bash
npm run test
```

### Backend Testing
```bash
cd server
npm test
```

## 📊 Performance Optimization

- **Database indexing** for fast queries
- **Lazy loading** for components
- **Image optimization** for faster loading
- **Caching strategies** for API responses
- **Bundle optimization** for smaller builds

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

#### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=railconnect
JWT_SECRET=your-secret-key
PORT=5000
```

## 📈 Analytics & Monitoring

The admin dashboard provides comprehensive analytics:

- **User statistics** and growth metrics
- **Booking trends** and revenue analysis
- **Train performance** and occupancy rates
- **Popular routes** and demand patterns
- **Real-time monitoring** of system health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Indian Railways** for train data and inspiration
- **IRCTC** for design inspiration
- **Open source community** for amazing libraries
- **React and Node.js** communities for excellent documentation

## 📞 Support

For support and questions:

- **Email**: support@railconnect.com
- **GitHub Issues**: [Create an issue](https://github.com/your-username/railconnect/issues)
- **Documentation**: [Wiki](https://github.com/your-username/railconnect/wiki)

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ User authentication
- ✅ Train search and booking
- ✅ Admin dashboard
- ✅ PDF ticket generation

### Phase 2 (Upcoming)
- 🔄 Real-time notifications
- 🔄 Mobile app (React Native)
- 🔄 Advanced analytics
- 🔄 Payment gateway integration

### Phase 3 (Future)
- 🔮 AI-powered recommendations
- 🔮 Multi-language support
- 🔮 International routes
- 🔮 API for third-party integrations

---

**Built with ❤️ by the RailConnect Team**
