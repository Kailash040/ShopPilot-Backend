const express = require('express');
const {
  getAllCustomers,
  getCustomerById,
  getCustomerSummary,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus
} = require('../controllers/customerController');

const router = express.Router();

// @route   GET /api/customers/summary
// @desc    Get customer summary statistics
// @access  Public
router.get('/summary', getCustomerSummary);

// @route   GET /api/customers
// @desc    Get all customers with filtering, sorting, and pagination
// @access  Public
router.get('/', getAllCustomers);

// @route   GET /api/customers/:id
// @desc    Get single customer by ID
// @access  Public
router.get('/:id', getCustomerById);

// @route   POST /api/customers
// @desc    Create new customer
// @access  Public
router.post('/', createCustomer);

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Public
router.put('/:id', updateCustomer);

// @route   PATCH /api/customers/:id/status
// @desc    Update customer status
// @access  Public
router.patch('/:id/status', updateCustomerStatus);

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Public
router.delete('/:id', deleteCustomer);

module.exports = router;

