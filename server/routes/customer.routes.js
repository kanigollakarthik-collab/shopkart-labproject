import express from 'express';
import {
  registerCustomer,
  loginCustomer,
  logoutCustomer,
  getMyProfile
} from '../controllers/customer.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

router.get('/me', protectRoute, getMyProfile);
router.post('/logout', protectRoute, logoutCustomer);

export default router;