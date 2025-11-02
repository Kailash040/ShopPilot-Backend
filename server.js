const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));

app.get('/', (req, res) => {
  res.json({ 
    message: 'SaaS Dashboard Backend API is running!',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        signin: 'POST /api/auth/signin',
        getProfile: 'GET /api/auth/me (requires token)'
      },
      orders: {
        getAllOrders: 'GET /api/orders',
        getOrderById: 'GET /api/orders/:id',
        getOrderByTrackingId: 'GET /api/orders/track/:trackingId',
        createOrder: 'POST /api/orders',
        updateOrder: 'PUT /api/orders/:id',
        updateOrderAction: 'PATCH /api/orders/:id/action',
        updateOrderStatus: 'PATCH /api/orders/:id/status',
        deleteOrder: 'DELETE /api/orders/:id'
      },
      customers: {
        getCustomerSummary: 'GET /api/customers/summary',
        getAllCustomers: 'GET /api/customers',
        getCustomerById: 'GET /api/customers/:id',
        createCustomer: 'POST /api/customers',
        updateCustomer: 'PUT /api/customers/:id',
        updateCustomerStatus: 'PATCH /api/customers/:id/status',
        deleteCustomer: 'DELETE /api/customers/:id'
      }
    }
  });
});

// Handle undefined routes - FIXED VERSION
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.originalUrl} not found`
//   });
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});