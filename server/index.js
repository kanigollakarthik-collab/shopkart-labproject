import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Ensure .env is loaded from the server directory regardless of where the command is launched from
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import customerRoutes from './routes/customer.routes.js';
import productRoutes from './routes/product.routes.js'
import wishlistRoutes from './routes/wishlist.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import { isMockPaymentMode } from './config/razorpay.js';
import { normalizeProductNumericFields } from './utils/normalizeProducts.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log(`\n========================================`);
console.log(`🛒 ShopKart Server Initializing...`);
console.log(`📁 Config path: ${path.join(__dirname, '.env')}`);
console.log(`🔑 MONGO_URI: ${process.env.MONGO_URI ? 'Loaded successfully' : '❌ NOT FOUND in environment!'}`);
console.log(`========================================\n`);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // permissive for local dev
    }
  },
  credentials: true, // CRITICAL: allows HttpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middlewares
app.use(express.json({ limit: '100kb' })); // Parses incoming JSON payloads
app.use(cookieParser()); // Parses incoming cookies for JWT extraction

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    paymentMode: isMockPaymentMode() ? 'mock' : 'razorpay',
  });
});

app.use('/products', productRoutes);
app.use('/customers', customerRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);     // Lab 05
app.use('/orders', orderRoutes);  // Lab 06

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Central error handler (malformed JSON, unexpected errors, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON body' });
  }
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: 'Something went wrong' });
});

// Database Connection & Server Start
console.log('⏳ Connecting to MongoDB Atlas...');

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
  })
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully!');
    try {
      await normalizeProductNumericFields();
    } catch (err) {
      console.error('⚠️  Product data normalization failed:', err.message);
    }
    app.listen(PORT, () => {
      console.log(`🚀 ShopKart server running on http://localhost:${PORT}`);
      if (isMockPaymentMode()) {
        console.warn('⚠️  Razorpay keys not configured — using MOCK payment mode (development only).');
      } else {
        console.log('💳 Razorpay Test Mode enabled.');
      }
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('\n👉 TIP: This usually means your current IP address is not whitelisted in MongoDB Atlas.');
      console.error('👉 Go to MongoDB Atlas Dashboard → Network Access → Add IP Address → "Allow Access from Anywhere" (0.0.0.0/0).\n');
    }
    // Start Express anyway so endpoints can still report health/status
    app.listen(PORT, () => {
      console.log(`⚠️  ShopKart server running on http://localhost:${PORT} (without active database connection)`);
    });
  });