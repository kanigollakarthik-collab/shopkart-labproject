import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PLACEHOLDER_PATTERN = /x{6,}|your_|placeholder|changeme/i;

export const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  return Boolean(
    keyId &&
      keySecret &&
      keyId.startsWith('rzp_') &&
      !PLACEHOLDER_PATTERN.test(keyId) &&
      !PLACEHOLDER_PATTERN.test(keySecret)
  );
};

const isProduction = () => process.env.NODE_ENV === 'production';

// Mock payments are NEVER allowed in production.
export const isMockPaymentMode = () => {
  if (isProduction()) return false;
  return process.env.PAYMENT_MODE === 'mock' || !isRazorpayConfigured();
};

// Secret used to sign/verify simulated payments (dev only).
export const getMockSigningSecret = () => process.env.MOCK_PAYMENT_SECRET || 'shopkart-dev-mock-secret';

let razorpayClientPromise = null;

// Lazily create the Razorpay SDK client so the server can still boot in mock
// mode even before `npm install razorpay` has been run.
export const getRazorpayClient = async () => {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env');
  }

  if (!razorpayClientPromise) {
    razorpayClientPromise = import('razorpay')
      .then(({ default: Razorpay }) =>
        new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        })
      )
      .catch((error) => {
        razorpayClientPromise = null;
        if (error.code === 'ERR_MODULE_NOT_FOUND') {
          throw new Error('Razorpay SDK is not installed. Run "npm install" inside the server folder.');
        }
        throw error;
      });
  }

  return razorpayClientPromise;
};
