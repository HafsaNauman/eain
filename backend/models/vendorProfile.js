// models/vendorProfile.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const VendorProfile = sequelize.define(
  'VendorProfile',
  {
    vendor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    vendor_type: {
      type: DataTypes.STRING(20), // 'product' | 'service' | 'both'
      allowNull: false,
    },
    business_name_en: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    business_name_ur: { //urdu
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description_en: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description_ur: { //urdu
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // JSONB only works on Postgres
    // Sequelize supports this as DataTypes.JSONB
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_female_only: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      // defaultValue: false, // becomes true after Publish my shop
      defaultValue: true // becomes true after Publish my shop

    },
    media: {
      type: DataTypes.JSONB, // e.g. { logo_url: '...', cover_url: '...' }
      allowNull: true,
    },
  },
  {
    tableName: 'vendor_profiles',
    underscored: true, // created_at, updated_at
    timestamps: true,  // Sequelize auto-manages DATE/TIMESTAMPTZ columns
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default VendorProfile;
