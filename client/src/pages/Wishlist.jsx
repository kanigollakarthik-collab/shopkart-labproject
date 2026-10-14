import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { emitWishlistChanged } from '../utils/events';
import { formatPrice, getErrorMessage } from '../utils/format';
import {
  HeartIcon,
  ShoppingCartIcon,
  TrashIcon,
  Spinner,
  ArrowRightIcon,
  AlertTriangleIcon,
} from '../components/Icons';

const Wishlist = () => {
  const { addToCart, isPending } = useCart();
  const toast = useToast();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await wishlistApi.get();
      setWishlist(response.data.wishlist || []);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load your wishlist."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId, name) => {
    try {
      await wishlistApi.remove(productId);
      setWishlist((prev) => prev.filter((item) => item._id !== productId));
      emitWishlistChanged();
      toast.info(`Removed ${name || 'product'} from wishlist`);
    } catch {
      toast.error('Unable to remove product from wishlist');
    }
  };

  const handleMoveToCart = async (product) => {
    const res = await addToCart(product._id);
    if (res.ok) {
      toast.success(`Added ${product.name} to cart!`);
    } else {
      toast.error(res.message);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-24 flex flex-col items-center justify-center text-center">
        <Spinner className="h-10 w-10 text-brand-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-1">Loading your wishlist...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-24 max-w-md mx-auto text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
          <AlertTriangleIcon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Unable to load wishlist</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button onClick={fetchWishlist} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="container-page py-20 max-w-lg mx-auto text-center animate-fade-up">
        <div className="h-24 w-24 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
          <HeartIcon className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3">Your wishlist is empty</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
          Save your favourite items while browsing and come back when you are ready to purchase.
        </p>
        <Link to="/products" className="btn btn-primary btn-lg">
          Browse Products
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Wishlist</h1>
          <p className="text-sm text-slate-400 mt-1">
            Saved items you love. Add them to your cart whenever you are ready.
          </p>
        </div>
        <span className="text-sm font-semibold text-rose-400">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => {
          const addingToCart = isPending(product._id);
          const isOutOfStock = product.stock <= 0;

          return (
            <div key={product._id} className="card card-hover flex flex-col overflow-hidden">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-900">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <span className="absolute top-3 left-3 chip text-[11px] py-1 px-2.5 font-semibold bg-ink-950/70 backdrop-blur-md border-white/10">
                  {product.category}
                </span>

                <button
                  onClick={() => handleRemove(product._id, product.name)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-ink-950/70 border border-white/10 text-rose-400 hover:text-white hover:bg-rose-500/80 flex items-center justify-center transition"
                  title="Remove from wishlist"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <Link to={`/products/${product._id}`} className="hover:text-brand-300 transition-colors">
                  <h3 className="font-display text-base font-bold text-white truncate">{product.name}</h3>
                </Link>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-display text-lg font-extrabold text-white">
                    {formatPrice(product.price)}
                  </span>
                  <span className={`text-xs font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isOutOfStock ? 'Out of stock' : `${product.stock} available`}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={() => handleMoveToCart(product)}
                    disabled={isOutOfStock || addingToCart}
                    className="btn btn-primary btn-sm w-full font-semibold flex items-center justify-center gap-2"
                  >
                    {addingToCart ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <ShoppingCartIcon className="h-4 w-4" />
                    )}
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>

                  <Link
                    to={`/products/${product._id}`}
                    className="btn btn-secondary btn-sm w-full text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;