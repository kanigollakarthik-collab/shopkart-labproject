import crypto from 'crypto';

// Razorpay signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
export const generatePaymentSignature = (razorpayOrderId, razorpayPaymentId, secret) =>
  crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');

// Constant-time comparison to avoid leaking information through timing.
export const isSignatureValid = (expected, received) => {
  if (typeof received !== 'string') return false;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};
