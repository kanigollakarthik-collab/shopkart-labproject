import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';
import {
  ShoppingCartIcon,
  HeartIcon,
  PackageIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '../components/Icons';

const Home = () => {
  const { user } = useAuth();
  const { totalUnits, subtotal } = useCart();

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in max-w-6xl">
      {/* Hero Welcome Banner */}
      <div className="card p-8 sm:p-12 mb-10 relative overflow-hidden bg-gradient-to-br from-brand-900/40 via-ink-850 to-ink-950 border-brand-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="chip py-1 px-3 text-xs bg-brand-500/20 text-brand-300 border-brand-400/30 mb-4 inline-flex items-center gap-1.5">
            <SparklesIcon className="h-3.5 w-3.5" />
            ShopKart Customer Dashboard
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Welcome back, <span className="text-gradient">{user?.fullName || 'Shopper'}</span>!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Continue exploring cutting-edge electronics, fashion, and books. Your cart and orders are saved securely in the cloud.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/products" className="btn btn-primary btn-lg font-bold">
              <span>Browse Catalog</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link to="/cart" className="btn btn-secondary btn-lg font-semibold">
              <ShoppingCartIcon className="h-4 w-4 text-brand-300" />
              <span>View Cart ({totalUnits})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {/* Cart Quick Card */}
        <Link to="/cart" className="card p-6 card-hover group flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-brand-500/15 border border-brand-400/20 text-brand-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCartIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
              Shopping Cart
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {totalUnits > 0
                ? `${totalUnits} items ready for checkout • ${formatPrice(subtotal)}`
                : 'Your cart is currently empty.'}
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-brand-300 gap-1">
            <span>Manage Cart</span>
            <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Wishlist Quick Card */}
        <Link to="/wishlist" className="card p-6 card-hover group flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-400/20 text-rose-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HeartIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
              Saved Wishlist
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Keep track of items you love and move them to cart with a single click.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-rose-300 gap-1">
            <span>Open Wishlist</span>
            <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Orders Quick Card */}
        <Link to="/orders" className="card p-6 card-hover group flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-sky-500/15 border border-sky-400/20 text-sky-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PackageIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
              Order History
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Track delivery milestones and view historical Razorpay receipts.
            </p>
          </div>
          <div className="mt-6 flex items-center text-xs font-semibold text-sky-300 gap-1">
            <span>View Orders</span>
            <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Account Profile Summary Card */}
      <div className="card p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-white mb-4 pb-3 border-b border-white/5">
          Account Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Full Name</span>
            <span className="font-bold text-white">{user?.fullName}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
            <span className="font-bold text-white">{user?.email}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Mobile</span>
            <span className="font-bold text-white">+91 {user?.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;