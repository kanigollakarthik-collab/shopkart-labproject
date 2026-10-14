import express from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  simulateMockPayment,
  verifyPayment,
  markPaymentFailed,
  getMyOrders,
  getOrderById,
  advanceOrderStatus,
} from '../controllers/order.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All order APIs are protected
router.use(protectRoute);

router.get('/payment-config', getPaymentConfig);

router.post('/create-payment-order', createPaymentOrder);
router.post('/', createPaymentOrder); // alias used in the lab's Postman test plan
router.post('/verify-payment', verifyPayment);
router.post('/mock-payment', simulateMockPayment); // dev only (placeholder keys)

router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/payment-failed', markPaymentFailed);
router.patch('/:id/status', advanceOrderStatus); // bonus: dev-only status progression

export default router;
