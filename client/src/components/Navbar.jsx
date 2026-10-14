import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { wishlistApi } from '../services/api';
import { WISHLIST_CHANGED_EVENT } from '../utils/events';
import { ShoppingCartIcon, HeartIcon, PackageIcon, SparklesIcon } from './Icons';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalUnits } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [animateCart, setAnimateCart] = useState(false);
  const navigate = useNavigate();

  // Load wishlist count & refresh on wishlist mutations via custom event
  useEffect(() => {
    let isMounted = true;
    const fetchWishlistCount = async () => {
      try {
        const { data } = await wishlistApi.get();
        if (isMounted) setWishlistCount(data.count ?? data.wishlist?.length ?? 0);
      } catch {
        // silently ignore if not logged in
      }
    };

    fetchWishlistCount();

    const handleWishlistChange = () => fetchWishlistCount();
    window.addEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChange);

    return () => {
      isMounted = false;
      window.removeEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChange);
    };
  }, []);

  // Trigger bounce animation when total units changes
  useEffect(() => {
    if (totalUnits > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 450);
      return () => clearTimeout(timer);
    }
  }, [totalUnits]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `relative px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
      isActive
        ? 'text-white bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
    }`;

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/[0.08] backdrop-blur-2xl">
      <div className="container-page flex h-18 items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/home" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-all duration-300 group-hover:scale-105">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-extrabold tracking-tight text-white group-hover:text-brand-300 transition-colors">
              Shop<span className="text-gradient">Kart</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
              Store & Co.
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <NavLink to="/products" className={navLinkClass}>
            Catalog
          </NavLink>

          <NavLink to="/wishlist" className={navLinkClass}>
            <HeartIcon className="h-4 w-4 text-rose-400" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {wishlistCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/cart" className={navLinkClass}>
            <ShoppingCartIcon className="h-4 w-4 text-brand-300" />
            <span>Cart</span>
            {/* Lab 05 requirement: Cart count dynamically in sync with state */}
            <span
              className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full transition-transform ${
                totalUnits > 0
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/40'
                  : 'bg-white/10 text-slate-400'
              } ${animateCart ? 'animate-bump scale-125' : ''}`}
            >
              {totalUnits}
            </span>
          </NavLink>

          <NavLink to="/orders" className={navLinkClass}>
            <PackageIcon className="h-4 w-4 text-sky-400" />
            <span className="hidden sm:inline">Orders</span>
          </NavLink>
        </nav>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <Link
              to="/home"
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition"
              title={`Logged in as ${user.email}`}
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500/30 to-accent-500/30 border border-brand-400/30 flex items-center justify-center text-xs font-bold text-brand-200">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-medium text-slate-300 max-w-28 truncate">
                {user.fullName?.split(' ')[0]}
              </span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Sign out of ShopKart"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;