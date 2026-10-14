import { useState, useEffect, useCallback } from 'react';
import api, { wishlistApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import { SearchIcon, Spinner, AlertTriangleIcon } from '../components/Icons';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Books'];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('');

  const fetchCatalog = useCallback(async (search, category, sort) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      if (sort) params.append('sort', sort);

      const [productsRes, wishlistRes] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        wishlistApi.get().catch(() => ({ data: { wishlist: [] } })),
      ]);

      setProducts(productsRes.data.products || []);
      const savedIds = (wishlistRes.data.wishlist || []).map((item) => item._id || item);
      setWishlistIds(savedIds);
    } catch {
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search and filter triggers
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCatalog(searchTerm, selectedCategory, sortBy);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCategory, sortBy, fetchCatalog]);

  const handleWishlistToggle = (productId, isSaved) => {
    setWishlistIds((prev) =>
      isSaved ? [...prev, productId] : prev.filter((id) => id !== productId)
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortBy('');
  };

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in">
      {/* Title */}
      <div className="mb-8 border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Product Catalog
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore curated essentials with live stock status and instant cart additions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 sm:p-5 mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-11 bg-ink-900/60"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Chips (Desktop) & Select */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`chip text-xs ${selectedCategory === cat ? 'chip-active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="w-full md:w-48">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input bg-ink-900 py-2.5 text-xs text-slate-300"
          >
            <option value="">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 flex flex-col gap-3">
              <div className="skeleton aspect-[4/3] w-full rounded-xl" />
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-10 w-full mt-2 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="alert alert-error max-w-md mx-auto my-12">
          <AlertTriangleIcon className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Failed to load catalog</p>
            <p className="text-xs">{error}</p>
          </div>
          <button
            onClick={() => fetchCatalog(searchTerm, selectedCategory, sortBy)}
            className="btn btn-secondary btn-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="card p-12 max-w-lg mx-auto text-center my-12">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 mb-4">
            <SearchIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No products match your criteria</h2>
          <p className="text-sm text-slate-400 mb-6">
            Try adjusting your search terms or clearing active category filters.
          </p>
          <button onClick={handleResetFilters} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              initialSaved={wishlistIds.includes(product._id)}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;