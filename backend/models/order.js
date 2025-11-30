
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Order = sequelize.define(
    'Order',
    {
        order_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id',
            },
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'vendor_profiles',
                key: 'vendor_id',
            },
        },
        listing_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'listings',
                key: 'listing_id',
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
            },
        },
        price_per_item: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'PKR',
        },
        payment_method: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['cod', 'bank_transfer']],
            },
            comment: "Only 'cod' or 'bank_transfer' allowed",
        },
        payment_status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'completed', 'failed']],
            },
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'confirmed', 'cancelled', 'completed']],
            },
            comment: "Order status: pending (new), confirmed (accepted), cancelled, completed",
        },
        shipping_address: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        area: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        customer_phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Any special instructions or notes from customer',
        },
        order_timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'orders',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['customer_id'],
                name: 'idx_order_customer_id',
            },
            {
                fields: ['vendor_id'],
                name: 'idx_order_vendor_id',
            },
            {
                fields: ['listing_id'],
                name: 'idx_order_listing_id',
            },
            {
                fields: ['status'],
                name: 'idx_order_status',
            },
            {
                fields: ['created_at'],
                name: 'idx_order_created_at',
            },
        ],
    }
);

export default Order;