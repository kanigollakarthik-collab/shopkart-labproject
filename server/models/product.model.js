import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be greater than 0'], // Enforces the Lab's validation rule
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'], // Enforces the Lab's validation rule
    },
  },
  { timestamps: true } // Automatically handles the 'createdAt' field
);

export default mongoose.model('Product', productSchema);