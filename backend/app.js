
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

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

console.log('🔄 Starting application...');

const app = express();
app.set('trust proxy', 1); 

console.log('🔄 Express app created');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('🔄 Middleware configured');

// Database connection & sync
async function connectDB() {
  try {
    console.log('🔄 Attempting database connection...');
    console.log('📍 DB Host:', process.env.DB_HOST);
    console.log('📍 DB Name:', process.env.DB_NAME);

    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    console.log('🔄 Syncing models...');
    await sequelize.sync({ alter: true }); // Set to true only for development if needed
    console.log('✅ Models synced with database.');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    console.error('❌ Error details:', err.message);
    process.exit(1);
  }
}

console.log('🔄 Calling connectDB...');
connectDB()
  .then(() => {
    console.log('✅ Database setup complete');
  })
  .catch((err) => {
    console.error('❌ Database setup failed:', err);
  });
// Compress all responses (~70% smaller)
app.use(compression());

// Rate limiting (prevent abuse)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                   // 200 requests per IP
  message: { success: false, message: 'Too many requests, try again later' }
}));

// ── RATE LIMITING ── ← ADD HERE
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, try again later' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, try again later' }
});

app.use('/api/auth', authLimiter);  // strict - login/signup only
app.use('/api/', apiLimiter);       // normal - everything else
// Routes
console.log('🔄 Setting up routes...');
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

const PORT = process.env.PORT || 3000;

console.log(`🔄 Starting server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
  console.log(`${'='.repeat(50)}\n`);
});

export default app;