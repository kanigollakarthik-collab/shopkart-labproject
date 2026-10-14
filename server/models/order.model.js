import mongoose from 'mongoose';

export const ORDER_STATUSES = ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'];

// Each item is a purchase-time SNAPSHOT. Even if the Product's name/price/image
// changes (or the product is deleted) later, the order still shows what was bought.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true, match: /^\d{6}$/ },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'An order must contain at least one item',
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Always calculated on the server from the latest Product prices (in ₹)
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PENDING',
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'PENDING_PAYMENT',
    },

    // RAZORPAY = real Razorpay Test Mode, MOCK = local simulated checkout (dev only, placeholder keys)
    paymentMode: {
      type: String,
      enum: ['RAZORPAY', 'MOCK'],
      default: 'RAZORPAY',
    },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: String,
    paidAt: Date,
    failureReason: String,

    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: 'PENDING_PAYMENT' }],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
