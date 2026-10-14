import crypto from 'crypto';
import mongoose from 'mongoose';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import {
  getRazorpayClient,
  isMockPaymentMode,
  isRazorpayConfigured,
  getMockSigningSecret,
} from '../config/razorpay.js';
import { generatePaymentSignature, isSignatureValid } from '../utils/paymentSignature.js';

// ───────────────────────────── Helpers ─────────────────────────────

const SHIPPING_FIELDS = {
  fullName: 'Full name',
  phone: 'Phone number',
  addressLine1: 'Address',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
};

const FULFILMENT_FLOW = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const normalizePhone = (phone) =>
  phone.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');

/**
 * Server-side validation of the shipping address.
 * Only the whitelisted fields are kept; whitespace-only values are rejected.
 */
const validateShippingAddress = (raw) => {
  const errors = {};
  const address = {};

  if (!raw || typeof raw !== 'object') {
    return { address, errors: { form: 'Shipping address is required' } };
  }

  for (const [field, label] of Object.entries(SHIPPING_FIELDS)) {
    const value = raw[field];
    const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
    address[field] = text;
    if (!text) errors[field] = `${label} is required`;
  }

  if (address.fullName && address.fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  if (address.phone) {
    address.phone = normalizePhone(address.phone);
    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }
  }

  if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
    errors.pincode = 'Pincode must contain 6 digits';
  }

  return { address, errors };
};

const devEndpointsEnabled = () =>
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_ENDPOINTS === 'true';

// ───────────────────────────── Controllers ─────────────────────────────

// GET /orders/payment-config — tells the UI whether real Razorpay or demo mode is active
export const getPaymentConfig = (req, res) => {
  const mockMode = isMockPaymentMode();
  res.status(200).json({
    success: true,
    mockMode,
    provider: 'razorpay',
    keyId: mockMode ? null : process.env.RAZORPAY_KEY_ID, // Key ID is public; the secret is never sent
    currency: 'INR',
  });
};

/**
 * POST /orders/create-payment-order   (alias: POST /orders)
 *
 * 1. Validate shipping address        5. Calculate total on the server
 * 2. Load the authenticated user cart 6. Persist a PENDING_PAYMENT order (snapshot)
 * 3. Reject an empty cart             7. Create a Razorpay Order (amount in paise)
 * 4. Re-load products + verify stock  8. Return safe checkout data (never the secret)
 *
 * The cart is NOT touched here — it is only cleared after verified payment.
 * Any totalAmount / prices sent by the browser are ignored.
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { address, errors } = validateShippingAddress(req.body?.shippingAddress);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: Object.values(errors)[0],
        errors,
      });
    }

    const user = await Customer.findById(req.user._id);

    if (!user.cart.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Load the LATEST product data — cart data may be stale
    const productIds = user.cart.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    const items = [];
    let totalAmount = 0;

    for (const cartItem of user.cart) {
      const product = productsById.get(cartItem.product.toString());

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'A product in your cart is no longer available. Please review your cart.',
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message:
            product.stock > 0
              ? `Insufficient stock for ${product.name}. Only ${product.stock} left.`
              : `Insufficient stock for ${product.name}. It is now out of stock.`,
        });
      }

      // Purchase-time snapshot
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });

      totalAmount += product.price * cartItem.quantity;
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const amountInPaise = Math.round(totalAmount * 100); // Razorpay expects the smallest currency unit

    if (amountInPaise < 100) {
      return res.status(400).json({ success: false, message: 'Order total must be at least ₹1' });
    }

    const mockMode = isMockPaymentMode();

    const order = await Order.create({
      user: user._id,
      items,
      shippingAddress: address,
      totalAmount,
      paymentMode: mockMode ? 'MOCK' : 'RAZORPAY',
    });

    let razorpayOrderId;

    try {
      if (mockMode) {
        razorpayOrderId = `order_mock_${crypto.randomBytes(7).toString('hex')}`;
      } else {
        const razorpay = await getRazorpayClient();
        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: order._id.toString(),
          notes: {
            shopKartOrderId: order._id.toString(),
            customerId: user._id.toString(),
          },
        });
        razorpayOrderId = razorpayOrder.id;
      }
    } catch (error) {
      console.error('Razorpay order creation failed:', error?.error?.description || error.message);
      order.paymentStatus = 'FAILED';
      order.failureReason = 'Unable to create Razorpay order';
      await order.save();

      return res.status(502).json({
        success: false,
        message: 'Unable to start the payment right now. Your cart is safe — please try again.',
      });
    }

    order.razorpayOrderId = razorpayOrderId;
    await order.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      totalAmount,
      key: mockMode ? null : process.env.RAZORPAY_KEY_ID,
      mockMode,
    });
  } catch (error) {
    console.error('createPaymentOrder error:', error);
    return res.status(500).json({ success: false, message: 'Server error while creating order' });
  }
};

/**
 * POST /orders/mock-payment — DEV ONLY.
 * Simulates what Razorpay Checkout returns after a successful test payment
 * (payment id + signature) for orders created while keys are placeholders.
 * The result must still be sent to /orders/verify-payment like a real payment.
 */
export const simulateMockPayment = async (req, res) => {
  try {
    if (!isMockPaymentMode()) {
      return res.status(403).json({ success: false, message: 'Mock payments are disabled' });
    }

    const { shopKartOrderId } = req.body ?? {};

    if (!mongoose.isValidObjectId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentMode !== 'MOCK' || !order.razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'This order cannot be paid in mock mode' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(409).json({ success: false, message: 'Order is already paid' });
    }

    const razorpayPaymentId = `pay_mock_${crypto.randomBytes(7).toString('hex')}`;

    return res.status(200).json({
      success: true,
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: generatePaymentSignature(order.razorpayOrderId, razorpayPaymentId, getMockSigningSecret()),
    });
  } catch (error) {
    console.error('simulateMockPayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /orders/verify-payment
 * Verifies the Razorpay HMAC-SHA256 signature using the razorpayOrderId STORED
 * in our database (not the one supplied by the browser). Only on success:
 *   → paymentStatus = PAID, status = PLACED → stock reduced → cart cleared.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification details' });
    }

    if (!mongoose.isValidObjectId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, message: 'Payment already verified', order });
    }

    if (!order.razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'No payment was initiated for this order' });
    }

    if (razorpay_order_id && razorpay_order_id !== order.razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Payment does not belong to this order' });
    }

    let secret;
    if (order.paymentMode === 'MOCK') {
      if (!isMockPaymentMode()) {
        return res.status(400).json({ success: false, message: 'Mock payments cannot be verified in this environment' });
      }
      secret = getMockSigningSecret();
    } else {
      if (!isRazorpayConfigured()) {
        return res.status(503).json({ success: false, message: 'Payment gateway is not configured' });
      }
      secret = process.env.RAZORPAY_KEY_SECRET;
    }

    // Trusted order id comes from OUR database
    const expectedSignature = generatePaymentSignature(order.razorpayOrderId, razorpay_payment_id, secret);

    if (!isSignatureValid(expectedSignature, razorpay_signature)) {
      // Order stays unpaid and the cart is NOT cleared
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Atomic transition so a double submission cannot process the order twice
    const now = new Date();
    const confirmedOrder = await Order.findOneAndUpdate(
      { _id: order._id, user: req.user._id, paymentStatus: { $ne: 'PAID' } },
      {
        $set: {
          paymentStatus: 'PAID',
          status: 'PLACED',
          razorpayPaymentId: razorpay_payment_id,
          paidAt: now,
          failureReason: null,
        },
        $push: { statusHistory: { status: 'PLACED', at: now } },
      },
      { returnDocument: 'after' }
    );

    if (!confirmedOrder) {
      const alreadyPaid = await Order.findById(order._id);
      return res.status(200).json({ success: true, message: 'Payment already verified', order: alreadyPaid });
    }

    // Reduce stock for purchased items (guarded so stock never goes negative)
    const stockResults = await Promise.all(
      confirmedOrder.items.map((item) =>
        Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        )
      )
    );

    // Never fail silently: report any item whose stock could not be reduced
    const unreducedItems = confirmedOrder.items.filter((_, i) => stockResults[i].modifiedCount !== 1);
    if (unreducedItems.length > 0) {
      console.error(
        `⚠️  Stock NOT reduced for order ${confirmedOrder._id}:`,
        unreducedItems.map((item) => `${item.name} (x${item.quantity}, product ${item.product})`).join(', ')
      );
    }

    // Only now — after verified payment — clear the cart
    const user = await Customer.findById(req.user._id);
    user.cart = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order placed',
      order: confirmedOrder,
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error while verifying payment' });
  }
};

// POST /orders/:id/payment-failed — record a failed/declined payment (cart is kept)
export const markPaymentFailed = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : 'Payment failed';

    const order = await Order.findOneAndUpdate(
      { _id: id, user: req.user._id, paymentStatus: 'PENDING' },
      { $set: { paymentStatus: 'FAILED', failureReason: reason || 'Payment failed' } },
      { returnDocument: 'after' }
    );

    if (!order) {
      const existing = await Order.findOne({ _id: id, user: req.user._id });
      if (!existing) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.status(200).json({ success: true, order: existing });
    }

    return res.status(200).json({ success: true, message: 'Payment marked as failed', order });
  } catch (error) {
    console.error('markPaymentFailed error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /orders — only the authenticated user's orders, newest first
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /orders/:id — ownership enforced (another user's order → 404)
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id }).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PATCH /orders/:id/status — BONUS (temporary development endpoint).
 * Moves a PAID order forward: PLACED → CONFIRMED → SHIPPED → DELIVERED.
 * Body: { "status": "SHIPPED" } (optional — defaults to the next stage).
 */
export const advanceOrderStatus = async (req, res) => {
  try {
    if (!devEndpointsEnabled()) {
      return res.status(403).json({ success: false, message: 'Status updates are disabled in production' });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Only paid orders can be progressed' });
    }

    const currentIndex = FULFILMENT_FLOW.indexOf(order.status);
    const requested = req.body?.status ?? FULFILMENT_FLOW[currentIndex + 1];
    const targetIndex = FULFILMENT_FLOW.indexOf(requested);

    if (targetIndex === -1) {
      return res.status(400).json({
        success: false,
        message: currentIndex === FULFILMENT_FLOW.length - 1 ? 'Order is already delivered' : 'Invalid status',
      });
    }

    if (targetIndex <= currentIndex) {
      return res.status(400).json({ success: false, message: 'Order status can only move forward' });
    }

    const now = new Date();
    for (let i = currentIndex + 1; i <= targetIndex; i += 1) {
      order.statusHistory.push({ status: FULFILMENT_FLOW[i], at: now });
    }
    order.status = FULFILMENT_FLOW[targetIndex];
    await order.save();

    return res.status(200).json({ success: true, message: `Order marked as ${order.status}`, order });
  } catch (error) {
    console.error('advanceOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
