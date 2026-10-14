import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { orderApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice, formatDateTime, shortOrderId, getErrorMessage } from '../utils/format';
import {
  PackageIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  Spinner,
  ArrowLeftIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CreditCardIcon,
  SparklesIcon,
} from '../components/Icons';

const STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);

  const orderPlacedNow = Boolean(location.state?.orderPlacedNow);

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const { data } = await orderApi.get(id);
        if (isMounted) setOrder(data.order);
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err, 'Unable to load order details.'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Bonus Handler: Advance status for TA grading / demo
  const handleAdvanceStatus = async () => {
    if (!order || advancing) return;
    setAdvancing(true);
    try {
      const { data } = await orderApi.advanceStatus(order._id);
      setOrder(data.order);
      toast.success(`Order advanced to: ${data.order.status}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to advance order status'));
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center text-center">
        <Spinner className="h-10 w-10 text-brand-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-1">Loading order details...</h2>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-20 max-w-md mx-auto text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
          <AlertTriangleIcon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">{error || 'Unable to access this order.'}</p>
        <Link to="/orders" className="btn btn-primary">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.status);

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in max-w-5xl">
      {/* Back link */}
      <div className="mb-6">
        <Link to="/orders" className="text-sm font-semibold text-brand-300 hover:underline inline-flex items-center gap-1.5">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to My Orders
        </Link>
      </div>

      {/* Success Celebration Banner if arriving right after checkout */}
      {orderPlacedNow && (
        <div className="card p-6 sm:p-8 mb-8 border-emerald-500/40 bg-emerald-500/10 shadow-2xl animate-fade-up">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Order Placed Successfully!</h1>
              <p className="text-sm text-emerald-200/90 mt-1 leading-relaxed">
                Thank you for your purchase. Razorpay test payment was verified and your shopping cart has been cleared.
              </p>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                <Link to="/products" className="btn btn-secondary btn-sm">
                  Continue Shopping
                </Link>
                <Link to="/orders" className="btn btn-ghost btn-sm text-emerald-300 hover:text-white">
                  View All Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="card p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Order Reference</span>
              <span className="chip py-0.5 px-2 text-[10px] bg-brand-500/15 text-brand-300 border-brand-400/20 font-mono">
                {order._id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Order {shortOrderId(order._id)}
            </h1>
            <p className="text-xs text-slate-400 mt-1">Placed on {formatDateTime(order.createdAt)}</p>
          </div>

          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-xs text-slate-400">Total Paid</span>
            <span className="font-display text-2xl sm:text-3xl font-black text-gradient">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Status Tracker (Lab 06 Bonus Visualization) */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Fulfilment Progress</h2>
            {currentStepIndex < STEPS.length - 1 && (
              <button
                onClick={handleAdvanceStatus}
                disabled={advancing}
                className="btn btn-secondary btn-sm text-xs text-brand-300 hover:text-white"
                title="Bonus Challenge Demo: Moves order status forward in development"
              >
                {advancing ? <Spinner className="h-3.5 w-3.5" /> : <SparklesIcon className="h-3.5 w-3.5" />}
                <span>Advance Status (Demo)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm mb-2 transition-all ${
                      isCurrent
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-2 ring-brand-400/50'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-500 border border-white/5'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold ${
                      isCurrent ? 'text-white' : isCompleted ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Purchased Items List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-white mb-4 pb-3 border-b border-white/5">
              Purchased Items ({order.items.length})
            </h2>

            <div className="flex flex-col divide-y divide-white/5">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-xl object-cover bg-ink-900 border border-white/10 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-white text-sm sm:text-base truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatPrice(item.price)} × {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="font-display font-bold text-white text-sm sm:text-base">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 mt-5 pt-4 flex justify-between items-baseline text-sm">
              <span className="font-semibold text-slate-300">Order Subtotal</span>
              <span className="font-display text-lg font-bold text-white">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Meta (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Shipping Address */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5 text-slate-300">
              <MapPinIcon className="h-4 w-4 text-brand-300" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Delivery Address</h2>
            </div>
            <div className="text-sm text-slate-300 space-y-1">
              <p className="font-bold text-white">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p className="text-xs text-slate-400 pt-1 font-mono">
                Phone: +91 {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5 text-slate-300">
              <CreditCardIcon className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Payment Receipt</h2>
            </div>
            <div className="text-xs space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-emerald-400">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Gateway:</span>
                <span className="text-slate-200">
                  {order.paymentMode === 'MOCK' ? 'Razorpay (Simulated Sandbox)' : 'Razorpay Test Mode'}
                </span>
              </div>
              {order.razorpayOrderId && (
                <div className="flex justify-between">
                  <span>Razorpay Order:</span>
                  <span className="font-mono text-slate-200">{order.razorpayOrderId}</span>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span>Payment ID:</span>
                  <span className="font-mono text-slate-200">{order.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
