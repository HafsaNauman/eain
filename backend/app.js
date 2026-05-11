import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';


// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sttRoutes from './routes/stt.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import listingRoutes from './routes/listing.routes.js';
import orderRoutes from './routes/order.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import aiDescriptionRoutes from './routes/aiDescription.routes.js';
import visualSearchRoutes from './routes/visualSearch.routes.js';
import serviceRoutes from './routes/service.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import recommendRoutes from './routes/recommend.js';

console.log(' Starting application...');

const app = express();
app.set('trust proxy', 1);

// Trust the first proxy (ngrok, nginx, etc.) so express-rate-limit
// can read the real client IP from the X-Forwarded-For header


console.log('🔄 Express app created');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Database connection & sync
async function connectDB() {
  try {

    await sequelize.authenticate();
    console.log(' Database connection established successfully.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
    } else {
      await sequelize.sync();
    }
  } catch (err) {
    console.error(' Database connection error:', err);
    console.error(' Error details:', err.message);
    process.exit(1);
  }
}
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(' Database setup failed:', err);
  });
// Compress all responses (~70% smaller)
app.use(compression());

//rate limiting 
// Rate limiting (prevent abuse)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 300,                 // generous limit for development
  message: { success: false, message: 'Too many requests, try again later' }
}));

// ── RATE LIMITING ── ← ADD HERE
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,   // 50 login/signup attempts per 15 min
  message: { success: false, message: 'Too many login attempts, try again later' }
});


app.use('/api/recommend', recommendRoutes);
app.use('/api/events', recommendRoutes); // events/log shares the router

app.use(helmet());

app.use('/api/auth', authLimiter);  // strict - login/signup only

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stt', sttRoutes);

app.use('/api/vendor', vendorRoutes);
app.use('/api/vendor/listings', listingRoutes); // Vendor listing management (protected)
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiDescriptionRoutes);
app.use('/api/orders', orderRoutes); // Order management (protected)
app.use('/api/catalog', catalogRoutes); // Public catalog browse
app.use('/api/catalog', visualSearchRoutes);

app.use('/api/service', serviceRoutes);    // service provider routes
app.use('/api/bookings', bookingRoutes);   // customer booking routes

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API test route
app.get('/api', (req, res) => {
  res.send({ message: 'API working!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});



export default app;