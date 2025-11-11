import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/db.js';

const UserVerification = sequelize.define('UserVerification', {
  verification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  phone_number: { type: DataTypes.STRING },
  verification_code: { type: DataTypes.STRING },
  expires_at: { type: DataTypes.DATE },
  verification_status: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'user_verifications',
  timestamps: false
});

export default UserVerification;