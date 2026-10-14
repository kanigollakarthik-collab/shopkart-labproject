import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { cartApi } from '../services/api';
import { getErrorMessage } from '../utils/format';
import { useAuth } from './AuthContext';

/**
 * Lab 05 — Global Cart State (Context API + useReducer)
 *
 * One shared source of frontend truth for the cart. The Navbar badge, Product
 * cards, Cart page and Checkout summary all read from here, so they can never
 * disagree. Every mutation goes to the backend first and the server's returned
 * cart replaces local state, keeping UI ⇄ MongoDB in sync.
 *
 * Derived values (subtotal, total units…) are computed — never stored.
 */
const CartContext = createContext(null);

const initialState = {
  items: [],
  loading: false,
  error: null,
  initialized: false,
  pending: {}, // { [productId]: 'add' | 'update' | 'remove' } — per-item loading state
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, initialized: true, items: action.items };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'SET_ITEMS':
      return { ...state, items: action.items, initialized: true, error: null };
    case 'ITEM_PENDING':
      return { ...state, pending: { ...state.pending, [action.productId]: action.operation } };
    case 'ITEM_DONE': {
      const pending = { ...state.pending };
      delete pending[action.productId];
      return { ...state, pending };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export const CartProvider = ({ children }) => {
  const { status: authStatus } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const fetchCart = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const { data } = await cartApi.get();
      dispatch({ type: 'FETCH_SUCCESS', items: data.cart });
      return data.cart;
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', error: getErrorMessage(error, 'Unable to load your cart.') });
      return null;
    }
  }, []);

  // Load the cart once the user is authenticated; wipe it on logout
  useEffect(() => {
    if (authStatus === 'authenticated') fetchCart();
    if (authStatus === 'unauthenticated') dispatch({ type: 'RESET' });
  }, [authStatus, fetchCart]);

  const runMutation = useCallback(async (productId, operation, request) => {
    dispatch({ type: 'ITEM_PENDING', productId, operation });
    try {
      const { data } = await request();
      dispatch({ type: 'SET_ITEMS', items: data.cart });
      return { ok: true, message: data.message };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) };
    } finally {
      dispatch({ type: 'ITEM_DONE', productId });
    }
  }, []);

  const addToCart = useCallback(
    (productId) => runMutation(productId, 'add', () => cartApi.add(productId)),
    [runMutation]
  );

  const updateQuantity = useCallback(
    (productId, quantity) => runMutation(productId, 'update', () => cartApi.update(productId, quantity)),
    [runMutation]
  );

  const removeFromCart = useCallback(
    (productId) => runMutation(productId, 'remove', () => cartApi.remove(productId)),
    [runMutation]
  );

  // Used after a verified payment — the backend has already cleared the cart
  const clearCart = useCallback(() => dispatch({ type: 'SET_ITEMS', items: [] }), []);

  const derived = useMemo(() => {
    const totalUnits = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const quantities = new Map(state.items.map((item) => [item.product._id, item.quantity]));
    const hasStockIssues = state.items.some((item) => item.quantity > item.product.stock);
    return { totalUnits, subtotal, quantities, hasStockIssues, itemCount: state.items.length };
  }, [state.items]);

  const value = useMemo(
    () => ({
      cartItems: state.items,
      loading: state.loading,
      error: state.error,
      initialized: state.initialized,
      pending: state.pending,
      totalUnits: derived.totalUnits,
      subtotal: derived.subtotal,
      itemCount: derived.itemCount,
      hasStockIssues: derived.hasStockIssues,
      getQuantity: (productId) => derived.quantities.get(productId) ?? 0,
      isPending: (productId) => Boolean(state.pending[productId]),
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [state, derived, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};
