// models/listing.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Listing = sequelize.define(
  'Listing',
  {
    listing_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    listing_type: {
      type: DataTypes.STRING(20), // 'product' | 'service'
      allowNull: false,
    },
    title_en: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    title_ur: { //urdu
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
    price: {
      type: DataTypes.DECIMAL(10, 2), // maps to NUMERIC(10,2) in Postgres
      allowNull: true, // allow null for "price on request"
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'PKR',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Option 1: Postgres TEXT[] using ARRAY
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    media: {
      type: DataTypes.JSONB, // { images: ['url1', 'url2'], videos: [] }
      allowNull: true,
    },
    ai_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_female_only: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      // defaultValue: true,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null = unlimited (for services)
      defaultValue: null,
      validate: {
      min: 0
      }
    },
    reserved_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    track_inventory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Set to true for physical products, false for services'
    },
    low_stock_threshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 5,
      validate: {
        min: 0
      }
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Vendor city — used for location-based recommendations',
    },
    popularity_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Incremented on orders and bookings — used as popularity signal',
    },
  },
  {
    tableName: 'listings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

export default Listing;
