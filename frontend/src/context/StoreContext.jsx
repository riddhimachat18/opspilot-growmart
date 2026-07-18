/**
 * StoreContext — all state backed by the Supabase database via FastAPI.
 *
 * On mount: fetches user, orders, cart, wishlist, wallet from /api/*.
 * Mutations: call the API then update local state so the UI is instant.
 * The PRODUCTS catalog stays in constants.js (product definitions never change).
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS } from '../utils/constants';
import * as api from '../utils/api';

const StoreContext = createContext(null);

const DEMO_USER_FALLBACK = { id: 'user-aditi', name: 'Aditi Sharma', email: 'aditi@example.com', avatar: 'AS', wallet: 5000 };

export function StoreProvider({ children }) {
  const [user,         setUser]         = useState(DEMO_USER_FALLBACK);
  const [wallet,       setWallet]       = useState(5000);
  const [walletFlash,  setWalletFlash]  = useState(null);
  const [cartRows,     setCartRows]     = useState([]);   // [{product_id, quantity}]
  const [wishlistRows, setWishlistRows] = useState([]);   // [{product_id}]
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.fetchUser().catch(() => null),
      api.fetchCart().catch(() => []),
      api.fetchWishlist().catch(() => []),
      api.fetchOrders().catch(() => []),
      api.fetchWallet().catch(() => null),
    ]).then(([u, cart, wish, ords, wal]) => {
      if (u)    { setUser(u); }
      if (wal)  { setWallet(wal.balance ?? 5000); }
      setCartRows(cart || []);
      setWishlistRows(wish || []);
      setOrders(ords || []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived: hydrate cart/wishlist rows with full product objects ─────────
  const cartItems = cartRows.map(row => {
    const product = PRODUCTS.find(
      p => p.id === row.product_id || p.name.toLowerCase().includes(row.product_id.toLowerCase())
    );
    if (!product) return null;
    return { ...product, qty: row.quantity };
  }).filter(Boolean);

  const wishlist = wishlistRows.map(row =>
    PRODUCTS.find(p => p.id === row.product_id)
  ).filter(Boolean);

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  // ── Cart mutations ────────────────────────────────────────────────────────
  const addItem = useCallback(async (product, qty = 1) => {
    // Optimistic update
    setCartRows(prev => {
      const existing = prev.find(r => r.product_id === product.id);
      if (existing) return prev.map(r => r.product_id === product.id ? { ...r, quantity: r.quantity + qty } : r);
      return [...prev, { product_id: product.id, quantity: qty }];
    });
    try { await api.addCartItem(product.id, qty); }
    catch { api.fetchCart().then(setCartRows); } // rollback on failure
  }, []);

  const addItemById = useCallback(async (productId, qty = 1) => {
    const pid = productId.toLowerCase();
    const product = PRODUCTS.find(p =>
      p.id === productId ||
      p.id === pid ||
      p.name.toLowerCase() === pid ||
      pid.includes(p.name.toLowerCase()) ||      // signal "MagCharge 15W Wireless Charger" contains "MagCharge 15W"
      p.name.toLowerCase().includes(pid)          // short pid is substring of full name
    );
    if (product) await addItem(product, qty);
    return !!product;
  }, [addItem]);

  const removeItem = useCallback(async (productId) => {
    setCartRows(prev => prev.filter(r => r.product_id !== productId));
    try { await api.deleteCartItem(productId); }
    catch { api.fetchCart().then(setCartRows); }
  }, []);

  const updateQty = useCallback(async (productId, qty) => {
    if (qty < 1) return removeItem(productId);
    setCartRows(prev => prev.map(r => r.product_id === productId ? { ...r, quantity: qty } : r));
    try { await api.updateCartItem(productId, qty); }
    catch { api.fetchCart().then(setCartRows); }
  }, [removeItem]);

  // ── Wallet ────────────────────────────────────────────────────────────────
  const creditWallet = useCallback((amount) => {
    setWallet(prev => prev + amount);
    setWalletFlash({ amount, type: 'credit' });
    setTimeout(() => setWalletFlash(null), 3000);
    // Refresh from server after a moment to confirm
    setTimeout(() => api.fetchWallet().then(w => { if (w) setWallet(w.balance); }), 1500);
  }, []);

  // ── Orders ────────────────────────────────────────────────────────────────
  const addOrder = useCallback((order) => {
    setOrders(prev => [order, ...prev]);
    // Refresh from server
    setTimeout(() => api.fetchOrders().then(setOrders), 1000);
  }, []);

  const refreshOrders = useCallback(() => {
    api.fetchOrders().then(setOrders);
  }, []);

  return (
    <StoreContext.Provider value={{
      user, loading,
      // Cart
      cartItems, addItem, addItemById, removeItem, updateQty, cartTotal, cartCount,
      // Wallet
      wallet, creditWallet, walletFlash,
      // Wishlist & orders
      wishlist, orders, addOrder, refreshOrders,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);

// Backward-compat alias
export const useCart = () => {
  const store = useStore();
  return {
    items: store.cartItems, addItem: store.addItem,
    removeItem: store.removeItem, updateQty: store.updateQty,
    total: store.cartTotal, count: store.cartCount,
  };
};
