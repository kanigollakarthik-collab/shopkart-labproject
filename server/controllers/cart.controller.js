import mongoose from 'mongoose';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';

const CART_PRODUCT_FIELDS = 'name price image stock category';

/**
 * Loads the user's cart with each Product populated (latest name/price/stock).
 * Items whose Product has since been deleted are silently dropped from the cart.
 */
const loadPopulatedCart = async (userId) => {
  const user = await Customer.findById(userId)
    .select('cart')
    .populate({ path: 'cart.product', select: CART_PRODUCT_FIELDS });

  if (!user) return [];

  const validItems = user.cart.filter((item) => item.product);

  if (validItems.length !== user.cart.length) {
    await Customer.updateOne(
      { _id: userId },
      { $set: { cart: validItems.map((item) => ({ product: item.product._id, quantity: item.quantity })) } }
    );
  }

  return validItems.map((item) => ({ product: item.product, quantity: item.quantity }));
};

const sendCart = async (res, userId, message = 'Cart updated') => {
  const cart = await loadPopulatedCart(userId);
  return res.status(200).json({ success: true, message, cart });
};

const findCartItem = (user, productId) =>
  user.cart.find((item) => item.product.toString() === productId);

// Task 2: POST /cart/:productId — add product (or increment quantity by 1)
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId).select('name stock');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // The user always comes from the verified JWT — never from the request body
    const user = await Customer.findById(req.user._id);
    const existingItem = findCartItem(user, productId);
    const nextQuantity = (existingItem?.quantity ?? 0) + 1;

    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
    }

    if (nextQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) of ${product.name} available`,
      });
    }

    if (existingItem) {
      existingItem.quantity = nextQuantity; // same product again → increase quantity, no duplicate rows
    } else {
      user.cart.push({ product: product._id, quantity: 1 });
    }

    await user.save();
    return sendCart(res, user._id, 'Cart updated');
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Task 3: GET /cart — current user's cart with populated products
export const getCart = async (req, res) => {
  try {
    const cart = await loadPopulatedCart(req.user._id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Task 4: PATCH /cart/:productId — set an exact quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body ?? {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const parsedQuantity = typeof quantity === 'string' && quantity.trim() !== '' ? Number(quantity) : quantity;

    if (typeof parsedQuantity !== 'number' || !Number.isInteger(parsedQuantity)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number' });
    }

    if (parsedQuantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId).select('name stock');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await Customer.findById(req.user._id);
    const cartItem = findCartItem(user, productId);

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    // Always validated against the LATEST stock value
    if (parsedQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) of ${product.name} available`,
      });
    }

    cartItem.quantity = parsedQuantity;
    await user.save();

    return sendCart(res, user._id, 'Quantity updated');
  } catch (error) {
    console.error('updateCartQuantity error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Task 5: DELETE /cart/:productId — remove a product from the cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const user = await Customer.findById(req.user._id);

    if (!findCartItem(user, productId)) {
      return res.status(404).json({ success: false, message: 'Product not in cart' });
    }

    user.cart = user.cart.filter((item) => item.product.toString() !== productId);
    await user.save();

    return sendCart(res, user._id, 'Product removed from cart');
  } catch (error) {
    console.error('removeFromCart error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
