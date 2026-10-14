import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { formatPrice, formatDate, shortOrderId, getErrorMessage } from '../utils/format';
import {
  PackageIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  Spinner,
  CheckCircleIcon,
  ClockIcon,
} from '../components/Icons';

const statusBadges = {
  PLACED: { text: 'Placed', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  CONFIRMED: { text: 'Confirmed', bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  SHIPPED: { text: 'Shipped', bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  DELIVERED: { text: 'Delivered', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  PENDING_PAYMENT: { text: 'Payment Pending', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await orderApi.list();
      setOrders(data.orders || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your orders.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 1. Loading State
  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center text-center">
        <Spinner className="h-10 w-10 text-brand-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-1">Loading your orders...</h2>
        <p className="text-sm text-slate-400">Retrieving purchase history from database</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="container-page py-20 max-w-md mx-auto text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
          <AlertTriangleIcon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Failed to load orders</h2>
        <p className="text-sm text-slate-400 mb-6">{error}</p>
        <button onClick={fetchOrders} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State (Lab 06 Task 8)
  if (orders.length === 0) {
    return (
      <div className="container-page py-20 max-w-lg mx-auto text-center animate-fade-up">
        <div className="h-24 w-24 mx-auto rounded-3xl bg-brand-500/10 border border-brand-400/20 text-brand-300 flex items-center justify-center mb-6 shadow-xl shadow-brand-500/10">
          <PackageIcon className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3">No orders placed yet</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
          You haven't placed any orders yet. Discover our top-selling electronics, fashion, and books.
        </p>
        <Link to="/products" className="btn btn-primary btn-lg">
          Start Shopping
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // 4. Orders List View
  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8 border-b border-white/[0.08] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Orders</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review past purchases, delivery progress, and payment receipts.
          </p>
        </div>
        <span className="text-sm font-semibold text-brand-300">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
        </span>
      </div>

      <div className="flex flex-col gap-5 max-w-4xl">
        {orders.map((order) => {
          const badge = statusBadges[order.status] || {
            text: order.status,
            bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
          };
          const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

          return (
            <div key={order._id} className="card p-6 sm:p-7 card-hover flex flex-col gap-5">
              {/* Card Header: ID, Date, Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-500/15 border border-brand-400/20 text-brand-300 flex items-center justify-center">
                    <PackageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      Order {shortOrderId(order._id)}
                    </h2>
                    <p className="text-xs text-slate-400">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`badge border ${badge.bg}`}>{badge.text}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    {order.paymentStatus === 'PAID' ? '✓ Paid' : order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-ink-900/60 border border-white/5">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg object-cover bg-ink-950 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer: Total & View Details Link */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div>
                  <span className="text-xs text-slate-400">
                    Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}):
                  </span>
                  <span className="ml-2 font-display text-xl font-extrabold text-white">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>

                <Link
                  to={`/orders/${order._id}`}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 font-semibold text-brand-300 hover:text-white"
                >
                  <span>View Details</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
