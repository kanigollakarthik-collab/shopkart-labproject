import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { wishlistApi } from '../services/api';
import { emitWishlistChanged } from '../utils/events';
import { formatPrice } from '../utils/format';
import { HeartIcon, ShoppingCartIcon, Spinner, CheckCircleIcon } from './Icons';

const ProductCard = ({ product, initialSaved = false, onWishlistToggle }) => {
  const { addToCart, getQuantity, isPending } = useCart();
  const toast = useToast();

  const [isWishlisted, setIsWishlisted] = useState(initialSaved);
  const [wishlistPending, setWishlistPending] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const quantityInCart = getQuantity(product._id);
  const isAdding = isPending(product._id);
  const isOutOfStock = product.stock <= 0;
  const isAtMaxStock = quantityInCart >= product.stock;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (isOutOfStock || isAdding || isAtMaxStock) return;

    const res = await addToCart(product._id);
    if (res.ok) {
      setJustAdded(true);
      toast.success(
        quantityInCart > 0
          ? `Added another ${product.name} (now ${quantityInCart + 1} in cart)`
          : `Added ${product.name} to your cart`
      );
      setTimeout(() => setJustAdded(false), 2000);
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishlistPending) return;

    setWishlistPending(true);
    try {
      if (isWishlisted) {
        await wishlistApi.remove(product._id);
        setIsWishlisted(false);
        emitWishlistChanged();
        toast.info(`Removed ${product.name} from wishlist`);
        onWishlistToggle?.(product._id, false);
      } else {
        await wishlistApi.add(product._id);
        setIsWishlisted(true);
        emitWishlistChanged();
        toast.success(`Saved ${product.name} to wishlist`);
        onWishlistToggle?.(product._id, true);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setIsWishlisted(true);
        toast.info('Already in your wishlist');
      } else {
        toast.error('Unable to update wishlist');
      }
    } finally {
      setWishlistPending(false);
    }
  };

  return (
    <div className="card card-hover group flex flex-col overflow-hidden relative">
      {/* Category Tag & Wishlist Button Header */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-900">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-black/30 pointer-events-none" />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 chip text-[11px] py-1 px-2.5 font-semibold bg-ink-950/70 backdrop-blur-md border-white/10">
          {product.category}
        </span>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={wishlistPending}
          className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${
            isWishlisted
              ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/40'
              : 'bg-ink-950/60 text-slate-300 hover:text-white hover:bg-ink-950/90 border border-white/10'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlistPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <HeartIcon className="h-4 w-4" filled={isWishlisted} />
          )}
        </button>

        {/* Stock Badge Overlay if low or out */}
        {isOutOfStock ? (
          <span className="absolute bottom-3 left-3 badge bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Out of stock
          </span>
        ) : product.stock <= 3 ? (
          <span className="absolute bottom-3 left-3 badge bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Only {product.stock} left
          </span>
        ) : null}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <Link to={`/products/${product._id}`} className="group-hover:text-brand-300 transition-colors">
          <h3 className="font-display text-base font-bold text-white line-clamp-1">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {product.description || 'Premium selection with verified quality and swift dispatch.'}
        </p>

        {/* Price and Stock info */}
        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-display text-xl font-extrabold text-white">
            {formatPrice(product.price)}
          </span>
          <span className={`text-xs font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isOutOfStock ? 'Unavailable' : `${product.stock} in stock`}
          </span>
        </div>

        {/* Card Actions */}
        <div className="mt-5 grid grid-cols-5 gap-2">
          {/* Add to Cart button (4 cols) */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding || isAtMaxStock}
            className={`col-span-4 btn btn-sm font-semibold transition-all ${
              isOutOfStock
                ? 'btn-secondary cursor-not-allowed opacity-50'
                : justAdded
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : isAtMaxStock
                ? 'btn-secondary cursor-not-allowed opacity-75 text-amber-300'
                : 'btn-primary'
            }`}
          >
            {isAdding ? (
              <>
                <Spinner className="h-4 w-4" />
                <span>Adding...</span>
              </>
            ) : justAdded ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Added ✓</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isAtMaxStock ? (
              <span>Max in Cart ({quantityInCart})</span>
            ) : quantityInCart > 0 ? (
              <>
                <ShoppingCartIcon className="h-4 w-4" />
                <span>Add Another ({quantityInCart})</span>
              </>
            ) : (
              <>
                <ShoppingCartIcon className="h-4 w-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {/* Details link (1 col) */}
          <Link
            to={`/products/${product._id}`}
            className="col-span-1 btn btn-secondary btn-sm px-0 flex items-center justify-center text-slate-300 hover:text-white"
            title="View Details"
          >
            👁️
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;