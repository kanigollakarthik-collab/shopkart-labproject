# 🛒 ShopKart — Full-Stack MERN Commerce Application

> **Engineering Labs 01 to 06 Completed**
> - **Lab-01 & Lab-02**: Customer Authentication (JWT HttpOnly Cookies, Bearer Auth Fallback, bcrypt)
> - **Lab-03**: Product Catalog (Search, Category Filters, Price Sorting)
> - **Lab-04**: Wishlist System (MongoDB ObjectIds, Populate, Duplicate Prevention)
> - **Lab-05**: Shopping Cart (Global State, Derived Subtotal, Stock Limits, Persistent MongoDB Cart)
> - **Lab-06**: Checkout & Orders (Server Pricing, Stock Re-Verification, Razorpay Standard Test Checkout, HMAC-SHA256 Signature Verification, Cart Clear, Order History & Status Progression)

---

## 🌐 Live Deployment Links

- **Frontend (GitHub Pages):** [https://kanigollakarthik-collab.github.io/shopkart-labproject/](https://kanigollakarthik-collab.github.io/shopkart-labproject/)
- **GitHub Repository:** [https://github.com/kanigollakarthik-collab/shopkart-labproject](https://github.com/kanigollakarthik-collab/shopkart-labproject)

---

## 🚀 Local Development Setup

The project runs on `localhost` out of the box.

### 1. Backend Setup
```bash
cd server
npm install

# 1. Create your local .env file from the provided example
cp .env.example .env

# 2. Add your MongoDB connection string in server/.env:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shopkart

# 3. (Optional) Seed the database with sample products if empty
npm run seed

# 4. Start the server
npm run dev      # Starts server on http://localhost:5000 (with --watch)
```

#### Environment Variables (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shopkart
JWT_SECRET=project_jwt_secret
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Razorpay TEST MODE keys (Optional):
# When placeholder keys are used, ShopKart runs in Simulated Sandbox Mode so you can
# test the entire end-to-end checkout & HMAC verification without needing real keys.
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser. (The frontend automatically connects to `http://localhost:5000` when running locally).

---

## 📦 What Was Built in Lab 05 (Shopping Cart)

### 1. Data Model (`server/models/customer.model.js`)
- Extended Customer schema with `cart: [{ product: ObjectId, quantity: Number }]`.
- Quantity validated as whole number $\ge 1$.
- Existing users without cart default to `[]`.
- Only `productId` and `quantity` are saved; price and subtotal are never duplicated in MongoDB.

### 2. Backend Cart REST APIs (`server/controllers/cart.controller.js`)
| Method | Endpoint | Auth | Purpose |
|---|---|:---:|---|
| `POST` | `/cart/:productId` | ✅ | Adds product with qty 1 or increments existing quantity. Stock is validated. |
| `GET` | `/cart` | ✅ | Returns cart with populated Product details (prunes deleted products). |
| `PATCH` | `/cart/:productId` | ✅ | Sets specific quantity (validates stock limit, minimum 1). |
| `DELETE` | `/cart/:productId` | ✅ | Removes product from authenticated user's cart. |

### 3. Frontend Global State (`client/src/context/CartContext.jsx`)
- Built with React Context API and `useReducer`.
- One shared source of truth across `Navbar`, `ProductCard`, `ProductDetails`, `Cart`, and `Checkout`.
- Derived values calculated dynamically: `subtotal`, `totalUnits`, `itemCount`, `hasStockIssues`.
- Loading & per-item pending states for responsive UI.

### 4. Cart Page (`client/src/pages/Cart.jsx`)
- Accessible at `/cart`.
- Quantity controls `[-] qty [+]` with min 1 and max stock enforcement.
- Remove action with instant toast feedback.
- Dynamic Order Summary with subtotal and free delivery chip.
- Stock warning banner if stock drops below selected quantity.
- Handled UI states: Loading skeleton, Empty Cart (`🛒`), and Error screen with retry.

---

## 💳 What Was Built in Lab 06 (Checkout & Orders)

### 1. Order Data Model (`server/models/order.model.js`)
- Purchase-time item snapshots: `product`, `name`, `price`, `quantity`, `image`.
- Shipping address: `fullName`, `phone`, `addressLine1`, `city`, `state`, `pincode`.
- Server-side calculated `totalAmount`.
- Status fields: `paymentStatus` (`PENDING`, `PAID`, `FAILED`) and `status` (`PLACED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`).
- Identifiers: `razorpayOrderId`, `razorpayPaymentId`, `paidAt`, `statusHistory`.

### 2. Backend Order REST APIs (`server/controllers/order.controller.js`)
| Method | Endpoint | Auth | Purpose |
|---|---|:---:|---|
| `POST` | `/orders/create-payment-order` | ✅ | Validates address, re-checks stock, calculates total on server, creates pending order & Razorpay order in paise. |
| `POST` | `/orders/verify-payment` | ✅ | Verifies HMAC-SHA256 signature using DB's order ID. Marks order `PAID`/`PLACED`, decrements stock, clears user cart. |
| `GET` | `/orders` | ✅ | Returns authenticated user's orders (newest first). |
| `GET` | `/orders/:id` | ✅ | Enforces strict ownership. Other user's order $\rightarrow$ 404. |
| `PATCH` | `/orders/:id/status` | ✅ | **Bonus Challenge**: Advances status (`PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`). |

### 3. Razorpay Integration (`server/config/razorpay.js` & `client/src/pages/Checkout.jsx`)
- **Security**: `RAZORPAY_KEY_SECRET` never reaches the browser or GitHub. Only `RAZORPAY_KEY_ID` is sent to client.
- **Amounts in Paise**: Converted to paise (`Math.round(totalAmount * 100)`) on server.
- **Client Form Validation**: Validates full name, 10-digit phone, 6-digit pincode, and whitespace checks.
- **Simulated Test Payment Mode**: If placeholder keys are present in `.env`, the app automatically enables the developer sandbox modal so you can demo the complete payment flow, HMAC verification, cart clearance, and order confirmation without requiring live internet keys.

### 4. Orders & Order Confirmation Pages
- `/checkout`: Shipping details form, live cart summary, payment trigger.
- `/orders`: Historical orders list with order ID, date, thumbnail previews, total, and status badges.
- `/orders/:id`: Full order snapshot, delivery address, Razorpay payment receipt, status progression tracker, and **Bonus Advance Status** button for TA grading.
