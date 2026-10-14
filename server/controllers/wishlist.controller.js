import User from '../models/customer.model.js';
import Product from '../models/product.model.js';

// Task 2: Add Product to Wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id; // Extracted strictly from the auth middleware[cite: 4]

    // 1. Validate product exists[cite: 4]
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(userId);

    // 2. Prevent duplicates[cite: 4]
    if (user.wishlist.includes(productId)) {
      return res.status(409).json({ success: false, message: 'Product already in wishlist' });
    }

    // 3. Add ObjectId to wishlist and save[cite: 4]
    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid product ID' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Task 3: Get Current User's Wishlist[cite: 4]
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id; // Get authenticated user[cite: 4]

    // Find user and populate the wishlist references with specific product fields[cite: 4]
    const user = await User.findById(userId).populate({
      path: 'wishlist',
      select: 'name price category image stock'
    });

    res.status(200).json({
      success: true,
      count: user.wishlist.length,
      wishlist: user.wishlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Task 4: Remove Product from Wishlist[cite: 4]
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);

    // Check if product is actually in the wishlist[cite: 4]
    if (!user.wishlist.includes(productId)) {
      return res.status(404).json({ success: false, message: 'Product not in wishlist' });
    }

    // Remove the product reference[cite: 4]
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.status(200).json({ success: true, message: 'Product removed from wishlist' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid product ID' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};