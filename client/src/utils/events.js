// Wishlist is intentionally NOT global state (Lab 04). Components that change it
// broadcast a lightweight DOM event so the Navbar badge can refresh its count.
export const WISHLIST_CHANGED_EVENT = 'shopkart:wishlist-changed';

export const emitWishlistChanged = () => {
  window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
};
