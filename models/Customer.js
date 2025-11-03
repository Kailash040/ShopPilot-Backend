const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true
  },
  ordersCount: {
    type: Number,
    default: 0,
    min: [0, 'Orders count cannot be negative']
  },
  orderTotal: {
    type: Number,
    default: 0,
    min: [0, 'Order total cannot be negative']
  },
  customerSince: {
    type: Date,
    required: [true, 'Please add customer registration date'],
    default: Date.now
  },
  status: {
    type: String,
    required: [true, 'Please add a status'],
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Additional fields for abandoned carts tracking
  abandonedCarts: {
    type: Number,
    default: 0,
    min: [0, 'Abandoned carts cannot be negative']
  }
}, {
  timestamps: true
});

// Index for faster searches
customerSchema.index({ customerName: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ status: 1 });

/* Example of a valid Customer object:
{
  customerName: "John Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  ordersCount: 5,
  orderTotal: 1250.50,
  customerSince: new Date("2024-01-15"),
  status: "active",
  abandonedCarts: 2
}

Minimal valid Customer object (required fields only):
{
  customerName: "Jane Smith",
  email: "jane.smith@example.com",
  phone: "9876543210",
  customerSince: new Date(),
  status: "active"
}

Note: ordersCount, orderTotal, and abandonedCarts have default values of 0,
and customerSince defaults to Date.now() if not provided.
*/

module.exports = mongoose.model('Customer', customerSchema);
