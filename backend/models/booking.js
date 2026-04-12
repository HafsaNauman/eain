// models/booking.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Booking = sequelize.define(
  'Booking',
  {
    booking_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'vendor_profiles', key: 'vendor_id' },
    },
    listing_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // optional — book a specific service listing
      references: { model: 'listings', key: 'listing_id' },
    },
    slot_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    slot_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    duration_mins: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 60,
    },
    status: {
      type: DataTypes.ENUM(
        'pending',      // customer booked, awaiting provider approval
        'confirmed',    // provider approved
        'in_progress',  // service happening now
        'completed',    // done
        'cancelled',    // cancelled by customer/vendor/admin
        'rejected'      // provider rejected
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // can be null if price is negotiated
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'PKR',
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: { isIn: [['cod', 'bank_transfer', null]] },
    },
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [['pending', 'completed', 'failed']] },
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true, // for home service providers
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelled_by: {
      type: DataTypes.ENUM('customer', 'vendor', 'admin'),
      allowNull: true,
    },
    confirmed_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    rejected_at:  { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'bookings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['customer_id'], name: 'idx_booking_customer_id' },
      { fields: ['vendor_id'],   name: 'idx_booking_vendor_id' },
      { fields: ['status'],      name: 'idx_booking_status' },
      { fields: ['slot_date'],   name: 'idx_booking_slot_date' },
    ],
  }
);

export default Booking;
