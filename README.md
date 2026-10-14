# 🛒 ShopKart — Modern Full-Stack E-Commerce Platform

A production-ready, full-stack MERN (MongoDB, Express, React, Node.js) e-commerce web application with a responsive dark-mode interface, secure authentication, persistent cart and wishlist systems, and seamless checkout with Razorpay payment processing.

---

## 🌐 Live Links

- **Live Application:** [https://kanigollakarthik-collab.github.io/shopkart-labproject/](https://kanigollakarthik-collab.github.io/shopkart-labproject/)
- **GitHub Repository:** [https://github.com/kanigollakarthik-collab/shopkart-labproject](https://github.com/kanigollakarthik-collab/shopkart-labproject)

---

## ✨ Key Features

### 🔐 Authentication & Security
- **Secure Auth:** Customer registration and login with `bcrypt` password hashing.
- **Dual-Layer Session Handling:** HttpOnly JWT cookies combined with Bearer token authorization fallback to ensure seamless cross-domain support between separate hosting platforms.
- **Protected Routes:** Client-side route guards for user dashboards, carts, wishlists, and checkout.

### 🛍️ Product Discovery & Catalog
- **Instant Search & Filters:** Real-time search by keyword, multi-category filtering, and price sorting.
- **Detailed Product Pages:** High-resolution product images, comprehensive descriptions, pricing, and live inventory status indicators.
- **Database Normalization:** Automated schema checks ensure product data consistency.

### 💖 Wishlist
- Add or remove items from a personalized wishlist with a single click.
- Prevent duplicate additions using MongoDB ObjectIds.
- Fully synchronized across devices and sessions.

### 🛒 Shopping Cart
- **Persistent Cart:** Stored securely in MongoDB; cart items persist across user sessions.
- **Live Inventory Enforcement:** Dynamic quantity controls with minimum quantities and maximum available stock validation.
- **Derived Real-Time Calculations:** Subtotals, unit counts, and order summaries update automatically without duplicate database writes.

### 💳 Checkout & Order Processing
- **Server-Side Price Verification:** All pricing, item snapshots, and order totals are calculated and verified exclusively on the server to prevent tampering.
- **Razorpay Payment Gateway:** Integrated test checkout with HMAC-SHA256 signature verification.
- **Developer Test Sandbox Mode:** Built-in simulated payment modal for testing end-to-end checkout flows without requiring live keys.
- **Order Lifecycle Tracking:** Real-time progression tracking (`PLACED` → `CONFIRMED` → `SHIPPED` → `DELIVERED`).
- **Complete Order History:** View past orders, delivery addresses, and payment receipts.

### 🎨 Design & User Experience
- Built with a modern, glassmorphic dark-theme UI.
- Interactive micro-animations, loading skeletons, and non-blocking toast notifications.
- Fully responsive across desktop, tablet, and mobile devices.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), bcrypt |
| **Payments** | Razorpay Node.js SDK, Crypto (HMAC-SHA256) |
| **Deployment** | GitHub Pages (Frontend), Render (Backend) |

---

## 📁 Project Architecture

```
shopkart/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, ProductCard, Icons, etc.)
│   │   ├── context/            # Global State (AuthContext, CartContext, ToastContext)
│   │   ├── pages/              # Views (Home, Products, Cart, Checkout, Orders, Auth)
│   │   ├── services/           # Axios HTTP client & API service endpoints
│   │   └── utils/              # Formatting helpers & payment utilities
│   ├── index.html
│   └── vite.config.js
│
├── server/                     # Backend REST API
│   ├── config/                 # Razorpay and payment configuration
│   ├── controllers/            # Route handlers (auth, cart, products, orders, wishlist)
│   ├── middlewares/            # JWT authentication & route protection
│   ├── models/                 # Mongoose schemas (Customer, Product, Order)
│   ├── routes/                 # Express route definitions
│   ├── utils/                  # Token generation, payment verification, seeders
│   ├── seed.js                 # Database seeder for sample products
│   └── index.js                # Express app entrypoint & middleware configuration
│
└── .github/workflows/          # CI/CD deployment pipelines
```

---

## 🚀 Local Development Setup

Follow these steps to run the application locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or a local MongoDB instance)

---

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment configuration from the example file
cp .env.example .env
# (Windows Command Prompt: copy .env.example .env)
# (Windows PowerShell: Copy-Item .env.example .env)
```

Configure your `server/.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shopkart
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: Razorpay Test Keys (defaults to simulated sandbox mode if placeholders are used)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
```

Seed sample products and start the server:
```bash
# Optional: Seed the database with sample products if empty
npm run seed

# Start the development server with auto-reload
npm run dev
```
The backend will be running at **http://localhost:5000**.

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend will open at **http://localhost:5173** and automatically proxy requests to `http://localhost:5000`.

---

## 📡 REST API Overview

### Authentication (`/customers`)
- `POST /customers/register` — Register a new customer
- `POST /customers/login` — Sign in and receive credentials
- `GET  /customers/me` — Retrieve current authenticated profile
- `POST /customers/logout` — Terminate active session

### Products (`/products`)
- `GET /products` — Fetch catalog with search, category filtering, and sorting
- `GET /products/:id` — Fetch detailed specifications for a single product

### Wishlist (`/wishlist`)
- `GET    /wishlist` — Get authenticated customer's wishlist
- `POST   /wishlist/:productId` — Add item to wishlist
- `DELETE /wishlist/:productId` — Remove item from wishlist

### Cart (`/cart`)
- `GET    /cart` — Get current cart with populated product details
- `POST   /cart/:productId` — Add product to cart (increments quantity if already added)
- `PATCH  /cart/:productId` — Update item quantity with stock boundary validation
- `DELETE /cart/:productId` — Remove item from cart

### Orders & Checkout (`/orders`)
- `GET   /orders/payment-config` — Retrieve public gateway configuration
- `POST  /orders/create-payment-order` — Verify stock, compute server-side totals, and initialize order
- `POST  /orders/verify-payment` — Validate HMAC payment signature, clear cart, and finalize order
- `GET   /orders` — List authenticated user's order history
- `GET   /orders/:id` — Get detailed order summary and receipt
- `PATCH /orders/:id/status` — Advance order delivery status
