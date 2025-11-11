import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // is auto increment safe? what other options do i have
  full_name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  phone_number: { type: DataTypes.STRING, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  gender: { type: DataTypes.STRING },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  preferred_language: { type: DataTypes.STRING },
  literacy_level: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'users',
  timestamps: false // what is timestamps and why is this false
});

export default User;
