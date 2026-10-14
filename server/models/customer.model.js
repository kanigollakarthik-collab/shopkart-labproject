import mongoose from 'mongoose';

// Lab 05 — a cart entry stores ONLY a Product reference + quantity.
// Price, name, subtotal etc. are always derived from the latest Product data.
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity cannot be less than 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number',
      },
    },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId, // Stores ObjectIds, not full product objects
      ref: 'Product', // References the Product model
    }
  ],
    // Lab 05: existing users without a cart simply get an empty array
    cart: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true } 
);

export default mongoose.model('Customer', customerSchema);