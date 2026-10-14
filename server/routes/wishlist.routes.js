import express from 'express';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js'; // Assuming this is your auth middleware from Lab 02[cite: 4]

const router = express.Router();

// All routes are protected and require a valid JWT[cite: 4]
router.post('/:productId', protectRoute, addToWishlist);
router.get('/', protectRoute, getWishlist);
router.delete('/:productId', protectRoute, removeFromWishlist);

export default router;