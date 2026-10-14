import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { wishlistApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { emitWishlistChanged } from '../utils/events';
import { formatPrice, getErrorMessage } from '../utils/format';
import {
  ShoppingCartIcon,
  HeartIcon,
  Spinner,
  CheckCircleIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../components/Icons';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart, getQuantity, isPending } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProductAndWishlist = async () => {
      try {
        const [productRes, wishlistRes] = await Promise.all([
          api.get(`/products/${id}`),
          wishlistApi.get().catch(() => ({ data: { wishlist: [] } })),
        ]);

        if (isMounted) {
          setProduct(productRes.data);
          const savedIds = (wishlistRes.data.wishlist || []).map((item) => item._id || item);
          setIsWishlisted(savedIds.includes(productRes.data._id));
        }
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err, 'Could not load product details.'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductAndWishlist();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const quantityInCart = product ? getQuantity(product._id) : 0;
  const isAdding = product ? isPending(product._id) : false;
  const isOutOfStock = product ? product.stock <= 0 : false;
  const isAtMaxStock = product ? quantityInCart >= product.stock : false;

  const handleAddToCart = async () => {
    if (!product || isOutOfStock || isAdding || isAtMaxStock) return;

    const res = await addToCart(product._id);
    if (res.ok) {
      setJustAdded(true);
      toast.success(
        quantityInCart > 0
          ? `Added another ${product.name} (now ${quantityInCart + 1} in cart)`
          : `Added ${product.name} to cart`
      );
      setTimeout(() => setJustAdded(false), 2000);
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || wishlistPending) return;
    setWishlistPending(true);
    try {
      if (isWishlisted) {
        await wishlistApi.remove(product._id);
        setIsWishlisted(false);
        emitWishlistChanged();
        toast.info(`Removed ${product.name} from wishlist`);
      } else {
        await wishlistApi.add(product._id);
        setIsWishlisted(true);
        emitWishlistChanged();
        toast.success(`Saved ${product.name} to wishlist`);
      }
    } catch {
      toast.error('Unable to update wishlist');
    } finally {
      setWishlistPending(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-24 flex flex-col items-center justify-center text-center">
        <Spinner className="h-10 w-10 text-brand-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-1">Loading product details...</h2>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-page py-24 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Product Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'This item could not be found.'}</p>
        <Link to="/products" className="btn btn-primary">
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in max-w-6xl">
      <div className="mb-6">
        <Link
          to="/products"
          className="text-sm font-semibold text-brand-300 hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Catalog
        </Link>
      </div>

      <div className="card p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Product Image (5 cols) */}
        <div className="md:col-span-5 relative aspect-square w-full rounded-2xl overflow-hidden bg-ink-900 border border-white/10 group">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Category Chip */}
          <span className="absolute top-4 left-4 chip text-xs bg-ink-950/80 backdrop-blur-md border-white/10">
            {product.category}
          </span>
        </div>

        {/* Product Details (7 cols) */}
        <div className="md:col-span-7 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-brand-300">
              {product.category}
            </span>

            {/* Wishlist button */}
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistPending}
              className={`btn btn-sm rounded-full ${
                isWishlisted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'btn-secondary text-slate-300'
              }`}
            >
              {wishlistPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <HeartIcon className="h-4 w-4 text-rose-400" filled={isWishlisted} />
              )}
              <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-4 mb-6 pb-6 border-b border-white/10">
            <span className="font-display text-3xl sm:text-4xl font-black text-gradient">
              {formatPrice(product.price)}
            </span>
            <span className={`text-sm font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isOutOfStock
                ? 'Out of Stock'
                : product.stock <= 3
                ? `Only ${product.stock} units remaining!`
                : `${product.stock} units available`}
            </span>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
            {product.description ||
              'Crafted to perfection. Enjoy exceptional reliability, verified manufacturing standards, and swift checkout with ShopKart.'}
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding || isAtMaxStock}
              className={`btn btn-lg flex-1 font-bold ${
                isOutOfStock
                  ? 'btn-secondary cursor-not-allowed opacity-50'
                  : justAdded
                  ? 'bg-emerald-500 text-white'
                  : isAtMaxStock
                  ? 'btn-secondary cursor-not-allowed opacity-75 text-amber-300'
                  : 'btn-primary'
              }`}
            >
              {isAdding ? (
                <>
                  <Spinner className="h-5 w-5" />
                  <span>Adding to Cart...</span>
                </>
              ) : justAdded ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Added to Cart ✓</span>
                </>
              ) : isOutOfStock ? (
                <span>Currently Out of Stock</span>
              ) : isAtMaxStock ? (
                <span>Max Units in Cart ({quantityInCart})</span>
              ) : quantityInCart > 0 ? (
                <>
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span>Add Another (In Cart: {quantityInCart})</span>
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {quantityInCart > 0 && (
              <Link to="/cart" className="btn btn-secondary btn-lg font-semibold">
                View Cart ({quantityInCart})
              </Link>
            )}
          </div>

          {/* Assurance bullets */}
          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Genuine Product & Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-brand-300 shrink-0" />
              <span>Free Delivery in India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;