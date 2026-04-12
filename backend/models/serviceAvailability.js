// models/serviceAvailability.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

/**
 * Stores weekly recurring availability OR one-off specific date availability.
 * - Use day_of_week for recurring (e.g. available every Monday 10am-6pm)
 * - Use specific_date for one-off (e.g. blocked on Eid)
 */
const ServiceAvailability = sequelize.define(
  'ServiceAvailability',
  {
    availability_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vendor_profiles', key: 'vendor_id' },
    },
    day_of_week: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 0, max: 6 },
      comment: '0=Sunday, 1=Monday, ..., 6=Saturday. Null if specific_date is set.',
    },
    specific_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'For one-off date overrides. Null if day_of_week is set.',
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    slot_duration_mins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'false = blocked/unavailable for that day/date',
    },
  },
  {
    tableName: 'service_availability',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['vendor_id'], name: 'idx_availability_vendor_id' },
    ],
  }
);

export default ServiceAvailability;
