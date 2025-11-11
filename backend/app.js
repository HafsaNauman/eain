import express from 'express';
// import sequelize from './config/db.js';
import { User, UserVerification, sequelize } from './models/index.js';

// import authRoutes from './routes/auth.js';

const app = express();
app.use(express.json());

// try {
//   await sequelize.authenticate();
//   await sequelize.sync();
//   console.log('Database connected and synced');
// } catch (err) {
//   console.error('Connection error:', err);
// }

// DB connection and sync
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync(); // or sync({ alter: true }) during development
    console.log('Models synced with database.');
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

connectDB();

// app.use('/api/auth', authRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));