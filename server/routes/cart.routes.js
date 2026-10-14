import express from 'express';
import { addToCart, getCart, updateCartQuantity, removeFromCart } from '../controllers/cart.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Every cart route requires a valid JWT — the user is identified from the token only
router.use(protectRoute);

router.get('/', getCart);
router.post('/:productId', addToCart);
router.patch('/:productId', updateCartQuantity);
router.delete('/:productId', removeFromCart);

export default router;
