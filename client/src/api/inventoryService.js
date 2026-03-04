// api/inventoryService.js
// FULL MOCK - Production ready inventory API service
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getInventoryReport = async (vendorId, params = {}) => {
  await delay(800);
  
  if (params.type === 'recent_transactions') {
    return {
      success: true,
      data: [
        { 
          product_name: "iPhone 15 Pro", 
          type: 'stock_in', 
          quantity: 25, 
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          product_id: "PROD001"
        },
        { 
          product_name: "Samsung S24 Ultra", 
          type: 'stock_out', 
          quantity: 8, 
          date: new Date(Date.now() - 2*86400000).toISOString().split('T')[0],
          product_id: "PROD002"
        },
        { 
          product_name: "MacBook Air M3", 
          type: 'stock_in', 
          quantity: 5, 
          date: new Date(Date.now() - 3*86400000).toISOString().split('T')[0],
          product_id: "PROD003"
        },
        { 
          product_name: "iPad Pro 12.9", 
          type: 'stock_out', 
          quantity: 12, 
          date: new Date(Date.now() - 4*86400000).toISOString().split('T')[0],
          product_id: "PROD004"
        }
      ]
    };
  }

  return {
    success: true,
    data: {
      total_items: 247,
      total_value: 1250000,
      low_stock: 12,
      out_of_stock: 3,
      avg_stock_value: 5050,
      stock_turnover: 2.4
    }
  };
};

export const getLowStockHistory = async (vendorId) => {
  await delay(600);
  return {
    success: true,
    data: [
      { 
        product_name: "AirPods Pro 2", 
        type: 'low_stock', 
        quantity: 3, 
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        product_id: "PROD005"
      },
      { 
        product_name: "iPad Pro M4", 
        type: 'low_stock', 
        quantity: 7, 
        date: new Date(Date.now() - 2*86400000).toISOString().split('T')[0],
        product_id: "PROD006"
      },
      { 
        product_name: "Apple Watch Ultra", 
        type: 'low_stock', 
        quantity: 2, 
        date: new Date(Date.now() - 5*86400000).toISOString().split('T')[0],
        product_id: "PROD007"
      }
    ]
  };
};

export const bulkStockUpload = async (csvData, vendorId) => {
  await delay(2500);
  return {
    success: true,
    data: {
      processed: 156,
      updated: 134,
      errors: 2,
      message: "Bulk upload completed successfully"
    }
  };
};

export const exportInventoryCSV = async (vendorId) => {
  await delay(1200);
  return {
    success: true,
    data: {
      filename: `inventory_${vendorId}_${new Date().toISOString().split('T')[0]}.csv`,
      total_rows: 247,
      message: "CSV exported successfully"
    }
  };
};

// Bulk update helper
export const updateStockBulk = async (updates, vendorId) => {
  await delay(1800);
  return {
    success: true,
    data: {
      updated: updates.length,
      message: `${updates.length} products updated`
    }
  };
};

// Low stock alert simulation
export const markLowStockResolved = async (productId, vendorId) => {
  await delay(500);
  return { success: true, data: { product_id: productId, status: 'resolved' } };
};
