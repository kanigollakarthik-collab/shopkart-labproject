import jwt from 'jsonwebtoken';
import Customer from '../models/customer.model.js';

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = req.cookies.jwt || bearerToken;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized - No Token Provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const customer = await Customer.findById(decoded.id).select('-password');
    
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Customer Not Found' });
    }

    req.user = customer;
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized - Invalid Token' });
  }
};