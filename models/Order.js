const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true,
    maxlength: [100, 'Customer name cannot be more than 100 characters']
  },
  orderDate: {
    type: Date,
    required: [true, 'Please add an order date'],
    default: Date.now
  },
  orderType: {
    type: String,
    required: [true, 'Please add an order type'],
    enum: ['online', 'offline', 'phone', 'email'],
    default: 'online'
  },
  trackingId: {
    type: String,
    required: [true, 'Please add a tracking ID'],
    unique: true,
    trim: true,
    uppercase: true
  },
  orderTotal: {
    type: Number,
    required: [true, 'Please add an order total'],
    min: [0, 'Order total cannot be negative']
  },
  action: {
    type: String,
    required: [true, 'Please add an action'],
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  status: {
    type: String,
    required: [true, 'Please add a status'],
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  // Optional fields for additional order details
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  customerPhone: {
    type: String,
    trim: true
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  }
}, {
  timestamps: true
});

// Generate tracking ID before saving
orderSchema.pre('save', function(next) {
  if (!this.trackingId) {
    // Generate a unique tracking ID
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.trackingId = `ORD-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

/* Example of a valid Order object (complete):
{
  customerName: "John Doe",
  orderDate: new Date("2024-01-15"),
  orderType: "online",
  trackingId: "ORD-ABC123-XYZ",
  orderTotal: 1250.50,
  action: "processing",
  status: "active",
  description: "Customer order with express shipping",
  customerEmail: "john.doe@example.com",
  customerPhone: "+1234567890",
  shippingAddress: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  }
}

Minimal valid Order object (required fields only):
{
  customerName: "Jane Smith",
  orderTotal: 250.00,
  trackingId: "ORD-123456"
}

Note: 
- orderDate defaults to Date.now() if not provided
- orderType defaults to 'online' if not provided
- action defaults to 'pending' if not provided
- status defaults to 'active' if not provided
- trackingId will be auto-generated if not provided (format: ORD-{timestamp}-{random})
- description, customerEmail, customerPhone, and shippingAddress are optional
- orderType must be: 'online', 'offline', 'phone', or 'email'
- action must be: 'pending', 'processing', 'shipped', 'delivered', 'cancelled', or 'returned'
- status must be: 'active', 'inactive', or 'completed'
- orderTotal must be >= 0
*/

module.exports = mongoose.model('Order', orderSchema);
