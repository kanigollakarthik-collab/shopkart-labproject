import Customer from '../models/customer.model.js';
import bcrypt from 'bcrypt';
import { generateTokenAndSetCookie } from '../utils/generateToken.js';

// Task 1: Register Customer
export const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Validation
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check for existing customer
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create customer
    const newCustomer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    const customerResponse = {
      _id: newCustomer._id,
      fullName: newCustomer.fullName,
      email: newCustomer.email,
      phone: newCustomer.phone,
    };

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: customerResponse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, customer.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    generateTokenAndSetCookie(customer._id, res);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  res.status(200).json(req.user);
};

export const logoutCustomer = (req, res) => {
  res.cookie('jwt', '', { maxAge: 0 }); // Clear the cookie
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

