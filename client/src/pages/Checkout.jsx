import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { orderApi } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import { formatPrice, getErrorMessage } from '../utils/format';
import {
  validateShipping,
  validateShippingField,
  normalizeShipping,
  INDIAN_STATES,
} from '../utils/shipping';
import {
  CreditCardIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  Spinner,
  ArrowLeftIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '../components/Icons';

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, subtotal, totalUnits, clearCart, loading: cartLoading } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Mock Modal State (when running in local mock payment mode)
  const [mockPaymentData, setMockPaymentData] = useState(null);
  const [mockProcessing, setMockProcessing] = useState(false);

  // If cart is empty, redirect back to cart page
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0 && !submitting) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems, cartLoading, navigate, submitting]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateShippingField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const errorMsg = validateShippingField(name, value);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  // Complete Payment Verification on the Backend
  const handleVerifyPayment = async (verificationPayload, shopKartOrderId) => {
    try {
      const { data } = await orderApi.verifyPayment(verificationPayload);
      if (data.success) {
        // Lab 06 Task 5: Clear frontend global cart state ONLY after verified payment
        clearCart();
        toast.success('Payment verified! Your order has been placed.');
        navigate(`/orders/${shopKartOrderId}`, {
          state: { orderPlacedNow: true, order: data.order },
          replace: true,
        });
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Payment verification failed. Your cart has been kept safe.');
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setMockPaymentData(null);
    }
  };

  // Submit Handler: Validate client-side, then call POST /orders/create-payment-order
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Mark all touched & validate
    const validationErrors = validateShipping(formData);
    setErrors(validationErrors);
    setTouched({
      fullName: true,
      phone: true,
      addressLine1: true,
      city: true,
      state: true,
      pincode: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the errors in your shipping details.');
      return;
    }

    setSubmitting(true);

    try {
      const cleanedAddress = normalizeShipping(formData);

      // 1. Call Backend to create ShopKart order + Razorpay order
      // (Backend calculates total on server & validates stock again)
      const { data } = await orderApi.createPaymentOrder(cleanedAddress);

      if (!data.success) {
        throw new Error(data.message || 'Could not initiate checkout');
      }

      const { shopKartOrderId, razorpayOrderId, amount, currency, key, mockMode } = data;

      // 2. Decide between Real Razorpay Checkout and Dev Mock Mode
      if (mockMode) {
        // Keys in .env are placeholders -> open simulated test checkout dialog
        setMockPaymentData({ shopKartOrderId, razorpayOrderId, amount });
        return;
      }

      // 3. Real Razorpay Test Checkout
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      const razorpayOptions = {
        key,
        amount,
        currency,
        name: 'ShopKart',
        description: 'ShopKart Order Checkout',
        order_id: razorpayOrderId,
        handler: async (response) => {
          // Do NOT mark payment as successful here on client alone.
          // Send signature to backend for HMAC verification.
          await handleVerifyPayment(
            {
              shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            shopKartOrderId
          );
        },
        prefill: {
          name: cleanedAddress.fullName,
          contact: cleanedAddress.phone,
          email: user?.email || '',
        },
        theme: {
          color: '#7c3aed',
        },
      };

      const paymentInstance = new window.Razorpay(razorpayOptions);

      paymentInstance.on('payment.failed', async (response) => {
        console.error('Razorpay payment failed:', response.error);
        const reason = response.error?.description || 'Payment declined or cancelled';
        try {
          await orderApi.markPaymentFailed(shopKartOrderId, reason);
        } catch {
          // ignore
        }
        setApiError(`Payment failed: ${reason}. Your cart has not been cleared. Please try again.`);
        toast.error('Payment failed. Cart preserved.');
        setSubmitting(false);
      });

      paymentInstance.open();
    } catch (err) {
      const msg = getErrorMessage(err, 'Unable to initiate payment.');
      setApiError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  // Mock Payment Actions (Dev Only)
  const handleSimulateMockSuccess = async () => {
    if (!mockPaymentData) return;
    setMockProcessing(true);
    try {
      const { data } = await orderApi.simulateMockPayment(mockPaymentData.shopKartOrderId);
      await handleVerifyPayment(
        {
          shopKartOrderId: mockPaymentData.shopKartOrderId,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        },
        mockPaymentData.shopKartOrderId
      );
    } catch (err) {
      toast.error(getErrorMessage(err, 'Mock payment simulation failed'));
      setSubmitting(false);
      setMockPaymentData(null);
    } finally {
      setMockProcessing(false);
    }
  };

  const handleSimulateMockFailure = async () => {
    if (!mockPaymentData) return;
    setMockProcessing(true);
    try {
      await orderApi.markPaymentFailed(
        mockPaymentData.shopKartOrderId,
        'Simulated test payment failure (User declined)'
      );
      setApiError('Simulated payment declined. Cart preserved intact.');
      toast.info('Simulated payment was cancelled.');
    } finally {
      setMockProcessing(false);
      setSubmitting(false);
      setMockPaymentData(null);
    }
  };

  return (
    <div className="container-page py-8 sm:py-12 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link to="/cart" className="text-sm font-semibold text-brand-300 hover:underline inline-flex items-center gap-1.5">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Cart
        </Link>
      </div>

      <div className="mb-8 border-b border-white/[0.08] pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Checkout</h1>
        <p className="text-sm text-slate-400 mt-1">
          Enter delivery address and review order before secure payment.
        </p>
      </div>

      {apiError && (
        <div className="alert alert-error mb-6">
          <AlertTriangleIcon className="h-5 w-5 shrink-0" />
          <div className="flex-1 text-sm">{apiError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shipping Form (Left 7 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="h-10 w-10 rounded-xl bg-brand-500/15 border border-brand-400/20 text-brand-300 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Shipping Address</h2>
                <p className="text-xs text-slate-400">Where should we deliver your order?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="label">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Aarav Sharma"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  className={`input ${errors.fullName ? 'input-error' : ''}`}
                  required
                />
                {errors.fullName && <p className="field-error">{errors.fullName}</p>}
              </div>

              {/* Phone */}
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="label">
                  Mobile Number (10 digits) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-slate-500 font-semibold select-none">
                    +91
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                    className={`input pl-14 ${errors.phone ? 'input-error' : ''}`}
                    required
                  />
                </div>
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>

              {/* Address Line 1 */}
              <div className="sm:col-span-2">
                <label htmlFor="addressLine1" className="label">
                  Street Address / House No. <span className="text-rose-400">*</span>
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  type="text"
                  placeholder="22 MG Road, Indiranagar"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  onBlur={() => handleBlur('addressLine1')}
                  className={`input ${errors.addressLine1 ? 'input-error' : ''}`}
                  required
                />
                {errors.addressLine1 && <p className="field-error">{errors.addressLine1}</p>}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="label">
                  City <span className="text-rose-400">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Bengaluru"
                  value={formData.city}
                  onChange={handleChange}
                  onBlur={() => handleBlur('city')}
                  className={`input ${errors.city ? 'input-error' : ''}`}
                  required
                />
                {errors.city && <p className="field-error">{errors.city}</p>}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="label">
                  State <span className="text-rose-400">*</span>
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  onBlur={() => handleBlur('state')}
                  className="input bg-ink-900"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st} className="bg-ink-900 text-white">
                      {st}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="field-error">{errors.state}</p>}
              </div>

              {/* Pincode */}
              <div className="sm:col-span-2">
                <label htmlFor="pincode" className="label">
                  Pincode (6 digits) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  placeholder="560001"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                  onBlur={() => handleBlur('pincode')}
                  className={`input ${errors.pincode ? 'input-error' : ''}`}
                  required
                />
                {errors.pincode && <p className="field-error">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="card p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-400/20 text-brand-300 flex items-center justify-center shrink-0">
              <CreditCardIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Payment Method: Razorpay Test Mode</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Transactions run in sandbox Test Mode. Supports UPI, Cards, Netbanking & Wallets without real currency deduction.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary & Final Submit (Right 5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24 flex flex-col gap-5">
          <div className="card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/5">
              <div className="h-8 w-8 rounded-lg bg-brand-500/15 text-brand-300 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-bold text-white">Order Review</h2>
            </div>

            {/* Item Snapshot Preview */}
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1 mb-4">
              {cartItems.map(({ product, quantity }) => (
                <div key={product._id} className="flex items-center gap-3 text-xs py-1.5">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-12 w-12 rounded-lg object-cover bg-ink-900 border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{product.name}</p>
                    <p className="text-slate-400">
                      Qty: {quantity} × {formatPrice(product.price)}
                    </p>
                  </div>
                  <div className="font-bold text-white shrink-0">
                    {formatPrice(product.price * quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t border-white/10 pt-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal ({totalUnits} units)</span>
                <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Delivery Charges</span>
                <span className="font-semibold text-emerald-400">FREE</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-white text-base">Amount Payable</span>
                <span className="font-display text-2xl font-black text-gradient">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="btn btn-primary btn-lg w-full mt-6 font-bold flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner className="h-5 w-5" />
                  <span>Initiating Payment...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-5 w-5" />
                  <span>Place Order • {formatPrice(subtotal)}</span>
                </>
              )}
            </button>

            <p className="mt-3 text-[11px] text-center text-slate-500">
              By placing the order you agree to ShopKart Terms of Sale.
            </p>
          </div>
        </div>
      </form>

      {/* Dev Mode Simulated Payment Modal (When placeholder keys are used in dev) */}
      {mockPaymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="card p-6 sm:p-8 max-w-md w-full shadow-2xl border-brand-500/30 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Simulated Razorpay Gateway</h3>
                <span className="chip py-0 px-2 text-[10px] bg-brand-500/20 text-brand-300 border-brand-400/30">
                  Dev Test Mode (Placeholder Keys)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Razorpay API keys in <code className="text-brand-300 bg-white/5 px-1 py-0.5 rounded">.env</code> are placeholder values.
              This dialog simulates Razorpay Checkout and tests the exact same server-side HMAC-SHA256 signature verification.
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs mb-6 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Ref:</span>
                <span className="font-mono text-white">{mockPaymentData.shopKartOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Razorpay Order:</span>
                <span className="font-mono text-white">{mockPaymentData.razorpayOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-emerald-400">
                  {formatPrice(mockPaymentData.amount / 100)} ({mockPaymentData.amount} paise)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleSimulateMockSuccess}
                disabled={mockProcessing}
                className="btn btn-primary font-bold py-3"
              >
                {mockProcessing ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                <span>Simulate Successful Payment</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateMockFailure}
                disabled={mockProcessing}
                className="btn btn-secondary text-rose-300 hover:text-rose-200 py-2.5"
              >
                Simulate Payment Failure / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
