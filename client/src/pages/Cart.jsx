import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';
import {
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ArrowRightIcon,
  Spinner,
  AlertTriangleIcon,
  ShieldCheckIcon,
} from '../components/Icons';

const Cart = () => {
  const {
    cartItems,
    loading,
    error,
    initialized,
    subtotal,
    totalUnits,
    itemCount,
    hasStockIssues,
    updateQuantity,
    removeFromCart,
    fetchCart,
    isPending,
  } = useCart();

  const toast = useToast();
  const navigate = useNavigate();

  const handleIncrease = async (product, currentQty) => {
    if (currentQty >= product.stock) {
      toast.error(`Cannot add more. Only ${product.stock} in stock.`);
      return;
    }
    const res = await updateQuantity(product._id, currentQty + 1);
    if (!res.ok) toast.error(res.message);
  };

  const handleDecrease = async (product, currentQty) => {
    if (currentQty <= 1) return; // Lab 05 requirement: minimum 1. For removal, user uses Remove button.
    const res = await updateQuantity(product._id, currentQty - 1);
    if (!res.ok) toast.error(res.message);
  };

  const handleRemove = async (product) => {
    const res = await removeFromCart(product._id);
    if (res.ok) {
      toast.info(`Removed ${product.name} from your cart.`);
    } else {
      toast.error(res.message);
    }
  };

  // 1. Loading State
  if (loading && !initialized) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center text-center">
        <Spinner className="h-10 w-10 text-brand-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-1">Loading your cart...</h2>
        <p className="text-sm text-slate-400">Fetching latest pricing and stock availability</p>
      </div>
    );
  }

  // 2. Error State
  if (error && cartItems.length === 0) {
    return (
      <div className="container-page py-20 max-w-md mx-auto text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
          <AlertTriangleIcon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Unable to load your cart</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button onClick={fetchCart} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State (Lab 05 Task 17)
  if (cartItems.length === 0) {
    return (
      <div className="container-page py-20 max-w-lg mx-auto text-center animate-fade-up">
        <div className="h-24 w-24 mx-auto rounded-3xl bg-brand-500/10 border border-brand-400/20 text-brand-300 flex items-center justify-center mb-6 shadow-xl shadow-brand-500/10">
          <ShoppingCartIcon className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3">Your cart is empty 🛒</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
          Looks like you haven't added anything yet. Explore our curated catalog of premium gadgets, books, and fashion.
        </p>
        <Link to="/products" className="btn btn-primary btn-lg">
          Browse Products
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // 4. Normal Cart View
  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review your items, adjust quantities, and proceed to secure checkout.
          </p>
        </div>
        <div className="text-sm font-semibold text-brand-300">
          {itemCount} {itemCount === 1 ? 'product' : 'products'} ({totalUnits} total units)
        </div>
      </div>

      {/* Stock warning banner if any item exceeds availability */}
      {hasStockIssues && (
        <div className="alert alert-warning mb-6">
          <AlertTriangleIcon className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Some items in your cart exceed current stock limits.</p>
            <p className="text-xs text-amber-300/90 mt-0.5">
              Please adjust item quantities to available stock before proceeding to checkout.
            </p>
          </div>
        </div>
      )}

      {/* Cart Layout: Items (left 7 cols) + Order Summary (right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {cartItems.map(({ product, quantity }) => {
            const pending = isPending(product._id);
            const itemTotal = product.price * quantity;
            const isExceeded = quantity > product.stock;

            return (
              <div
                key={product._id}
                className={`card p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-stretch sm:items-center justify-between transition-all ${
                  isExceeded ? 'border-amber-500/40 bg-amber-500/5' : ''
                } ${pending ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {/* Thumbnail & Product Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Link
                    to={`/products/${product._id}`}
                    className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-ink-900 border border-white/10 group"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {product.category}
                    </span>
                    <Link
                      to={`/products/${product._id}`}
                      className="block font-display text-base font-bold text-white hover:text-brand-300 transition-colors truncate"
                    >
                      {product.name}
                    </Link>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-bold text-white text-sm">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-xs text-slate-400">each</span>
                    </div>

                    <div className="mt-1 text-xs">
                      {product.stock <= 0 ? (
                        <span className="text-rose-400 font-semibold">Out of stock</span>
                      ) : isExceeded ? (
                        <span className="text-amber-400 font-semibold">
                          Only {product.stock} available! Reduce quantity.
                        </span>
                      ) : product.stock <= 3 ? (
                        <span className="text-amber-400 font-medium">
                          Only {product.stock} left in stock
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">In stock</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Subtotal */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  {/* Line Total */}
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider hidden sm:block">
                      Subtotal
                    </div>
                    <div className="font-display text-base sm:text-lg font-bold text-white">
                      {formatPrice(itemTotal)}
                    </div>
                  </div>

                  {/* Quantity Controls (Lab 05 [-] qty [+]) & Remove */}
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-xl border border-white/10 bg-ink-900/90 p-1">
                      <button
                        type="button"
                        onClick={() => handleDecrease(product, quantity)}
                        disabled={quantity <= 1 || pending}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>

                      <span className="w-8 text-center font-display text-sm font-bold text-white">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleIncrease(product, quantity)}
                        disabled={quantity >= product.stock || pending}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(product)}
                      disabled={pending}
                      className="h-9 w-9 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/40 flex items-center justify-center transition"
                      aria-label="Remove item"
                      title="Remove from cart"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-2 flex justify-between items-center text-xs text-slate-400">
            <Link to="/products" className="text-brand-300 hover:underline flex items-center gap-1">
              &larr; Continue shopping
            </Link>
            <span>Prices and stock synced with backend</span>
          </div>
        </div>

        {/* Order Summary Card (Lab 05 Task 13 & 15) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <div className="card p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-white mb-4">Order Summary</h2>

            <div className="flex flex-col gap-3 text-sm border-b border-white/10 pb-5">
              <div className="flex justify-between text-slate-300">
                <span>Items ({itemCount})</span>
                <span className="font-medium text-white">{totalUnits} units</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                {/* Dynamically derived subtotal */}
                <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  Shipping
                  <span className="chip py-0.5 px-2 text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                    Free
                  </span>
                </span>
                <span className="font-semibold text-emerald-400">₹0</span>
              </div>
            </div>

            {/* Final Total */}
            <div className="py-4 flex justify-between items-baseline">
              <span className="font-display text-base font-bold text-white">Estimated Total</span>
              <span className="font-display text-2xl font-black text-gradient">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              disabled={hasStockIssues || cartItems.length === 0}
              className="btn btn-primary btn-lg w-full mt-2 font-bold flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            {hasStockIssues && (
              <p className="mt-3 text-xs text-center text-amber-400">
                Resolve stock limits before proceeding to checkout.
              </p>
            )}

            {/* Trust badges */}
            <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Protected by 256-bit Razorpay encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-300 font-bold shrink-0">⚡</span>
                <span>Real-time price lock at checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
