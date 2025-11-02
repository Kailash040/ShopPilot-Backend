const Customer = require('../models/Customer');

// @desc    Get all customers with filtering, sorting, and pagination
// @route   GET /api/customers
// @access  Public
const getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'customerSince',
      sortOrder = 'desc',
      search,
      status
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await Customer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Customer.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: customers
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customers',
      error: error.message
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer',
      error: error.message
    });
  }
};

// @desc    Get customer statistics/summary
// @route   GET /api/customers/summary
// @access  Public
const getCustomerSummary = async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;

    // Calculate date range based on timeframe
    let startDate;
    const today = new Date();
    
    switch (timeframe.toLowerCase()) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    }

    // Get previous period for comparison
    const previousEndDate = new Date(startDate);
    const periodDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);

    // Current period stats
    const allCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    const inactiveCustomers = await Customer.countDocuments({ status: 'inactive' });
    const newCustomers = await Customer.countDocuments({
      customerSince: { $gte: startDate }
    });
    const purchasingCustomers = await Customer.countDocuments({
      ordersCount: { $gt: 0 }
    });
    const totalAbandonedCarts = await Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$abandonedCarts' }
        }
      }
    ]);

    // Previous period stats for comparison
    const prevAllCustomers = await Customer.countDocuments({
      customerSince: { $lt: startDate }
    });
    const prevActiveCustomers = await Customer.countDocuments({
      status: 'active',
      customerSince: { $lt: startDate }
    });
    const prevInactiveCustomers = await Customer.countDocuments({
      status: 'inactive',
      customerSince: { $lt: startDate }
    });
    const prevNewCustomers = await Customer.countDocuments({
      customerSince: { 
        $gte: previousStartDate, 
        $lt: startDate 
      }
    });

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous * 100).toFixed(2);
    };

    const allCustomersChange = calculateChange(allCustomers, prevAllCustomers);
    const activeCustomersChange = calculateChange(activeCustomers, prevActiveCustomers);
    const inactiveCustomersChange = calculateChange(inactiveCustomers, prevInactiveCustomers);
    const newCustomersChange = calculateChange(newCustomers, prevNewCustomers);

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        metrics: {
          allCustomers: {
            value: allCustomers,
            change: `${allCustomersChange >= 0 ? '+' : ''}${allCustomersChange}%`
          },
          activeCustomers: {
            value: activeCustomers,
            change: `${activeCustomersChange >= 0 ? '+' : ''}${activeCustomersChange}%`
          },
          inactiveCustomers: {
            value: inactiveCustomers,
            change: `${inactiveCustomersChange >= 0 ? '+' : ''}${inactiveCustomersChange}%`
          },
          newCustomers: {
            value: newCustomers,
            change: `${newCustomersChange >= 0 ? '+' : ''}${newCustomersChange}%`
          },
          purchasingCustomers: {
            value: purchasingCustomers,
            change: null
          },
          abandonedCarts: {
            value: totalAbandonedCarts[0]?.total || 0,
            change: null
          }
        }
      }
    });
  } catch (error) {
    console.error('Get customer summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving customer summary',
      error: error.message
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      ordersCount,
      orderTotal,
      customerSince,
      status,
      abandonedCarts
    } = req.body;

    // Validate required fields
    if (!customerName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, email, and phone are required'
      });
    }

    // Check if customer with email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    const customerData = {
      customerName,
      email,
      phone,
      ordersCount: ordersCount || 0,
      orderTotal: orderTotal || 0,
      customerSince: customerSince || new Date(),
      status: status || 'active',
      abandonedCarts: abandonedCarts || 0
    };

    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      ordersCount,
      orderTotal,
      customerSince,
      status,
      abandonedCarts
    } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if email is being changed and if it conflicts with existing customer
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Another customer with this email already exists'
        });
      }
      customer.email = email;
    }

    // Update fields
    if (customerName) customer.customerName = customerName;
    if (phone) customer.phone = phone;
    if (ordersCount !== undefined) customer.ordersCount = ordersCount;
    if (orderTotal !== undefined) customer.orderTotal = orderTotal;
    if (customerSince) customer.customerSince = customerSince;
    if (status) customer.status = status;
    if (abandonedCarts !== undefined) customer.abandonedCarts = abandonedCarts;

    const updatedCustomer = await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

// @desc    Update customer status
// @route   PATCH /api/customers/:id/status
// @access  Public
const updateCustomerStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (active or inactive) is required'
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.status = status;
    const updatedCustomer = await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer status updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Update customer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer status',
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerSummary,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus
};

