import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <HashRouter>
            <Routes>
              {/* Public authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected store routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/wishlist" element={<Wishlist />} />

                {/* Lab 05: Cart */}
                <Route path="/cart" element={<Cart />} />

                {/* Lab 06: Checkout & Orders */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/order-success/:id" element={<OrderDetails />} />
              </Route>

              {/* Default redirects */}
              <Route path="/" element={<Navigate to="/products" replace />} />
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
          </HashRouter>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;