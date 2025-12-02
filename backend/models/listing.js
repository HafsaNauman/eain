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
    // Option 2 (alternative): JSONB array if you prefer
    // tags: {
    //   type: DataTypes.JSONB,
    //   allowNull: true,
    // },
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
  },
  {
    tableName: 'listings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Listing;
