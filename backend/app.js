// import express from 'express';
// import cors from 'cors';
// import { User, UserVerification, sequelize } from './models/index.js';

// // Import routes
// import authRoutes from './routes/auth.routes.js';
// import userRoutes from './routes/user.routes.js';
// import adminRoutes from './routes/admin.routes.js';
// import sttRoutes from './routes/stt.routes.js'; 

// const app = express();

// // Middleware
// app.use(cors()); // Enable CORS
// app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
// app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded bodies

// // Database connection and sync
// async function connectDB() {
//   try {
//     await sequelize.authenticate();
//     console.log(' Database connection established successfully.');
    
//     await sequelize.sync({alter : true}); // or sync({ alter: true }) during development
//     console.log('Models synced with database.');
//   } catch (err) {
//     console.error(' Database connection error:', err);
//     process.exit(1);
//   }
// }

// connectDB();

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/stt', sttRoutes);  

// // Health check route
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Server is running' });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ 
//     success: false, 
//     message: 'Route not found' 
//   });
// });

// // Error handler
// app.use((err, req, res, next) => {
//   console.error('Server Error:', err);
//   res.status(500).json({ 
//     success: false, 
//     message: 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(` Server running on port ${PORT}`);
//   console.log(` API Base: http://localhost:${PORT}/api`);
// });
import express from 'express';
import cors from 'cors';
import { User, UserVerification, sequelize } from './models/index.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sttRoutes from './routes/stt.routes.js';

console.log('🔄 Starting application...');

const app = express();

console.log('🔄 Express app created');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('🔄 Middleware configured');

// Database connection and sync
async function connectDB() {
  try {
    console.log('🔄 Attempting database connection...');
    console.log('📍 DB Host:', process.env.DB_HOST);
    console.log('📍 DB Name:', process.env.DB_NAME);
    
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    console.log('🔄 Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced with database.');
    
  } catch (err) {
    console.error('❌ Database connection error:', err);
    console.error('❌ Error details:', err.message);
    process.exit(1);
  }
}

console.log('🔄 Calling connectDB...');
connectDB().then(() => {
  console.log('✅ Database setup complete');
}).catch((err) => {
  console.error('❌ Database setup failed:', err);
});

// Routes
console.log('🔄 Setting up routes...');
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stt', sttRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API test route
app.get('/api', (req, res) => {
  res.send({ message: "API working!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

console.log(`🔄 Starting server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`${'='.repeat(50)}\n`);
});

export default app;
