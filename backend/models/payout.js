import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Vendor Commission Rates
const VendorCommissionRate = sequelize.define('VendorCommissionRate', {
  rate_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vendor_profiles',
      key: 'vendor_id'
    }
  },
  commission_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  is_custom_rate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  effective_from: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  effective_to: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'vendor_commission_rates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Payouts
const Payout = sequelize.define('Payout', {
  payout_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'orders',
      key: 'order_id'
    }
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vendor_profiles',
      key: 'vendor_id'
    }
  },
  order_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  commission_deducted: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  net_payable: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'hold', 'ready_for_payout', 'paid', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  order_delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hold_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  payment_method: {
    type: DataTypes.ENUM('jazzcash', 'easypaisa', 'bank_transfer', 'manual'),
    allowNull: true
  },
  payment_reference: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'payouts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Payout Batches
const PayoutBatch = sequelize.define('PayoutBatch', {
  batch_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  batch_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('jazzcash', 'easypaisa', 'bank_transfer'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  processed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payout_batches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Payout Batch Items
const PayoutBatchItem = sequelize.define('PayoutBatchItem', {
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'payout_batches',
      key: 'batch_id'
    }
  },
  payout_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'payouts',
      key: 'payout_id'
    }
  }
}, {
  tableName: 'payout_batch_items',
  timestamps: false
});

export { VendorCommissionRate, Payout, PayoutBatch, PayoutBatchItem };
export default Payout;
