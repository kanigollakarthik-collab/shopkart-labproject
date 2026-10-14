const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

/**
 * Loads Razorpay Standard Checkout once and resolves to true/false.
 * Never assume window.Razorpay exists — the script can be blocked or fail to load.
 */
export const loadRazorpayScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      script.remove();
      scriptPromise = null; // allow a retry later
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
};
