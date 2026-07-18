/**
 * api.js — typed fetch wrappers for every backend REST endpoint.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.json();
}

// ── User & wallet ─────────────────────────────────────────────────────────
export const fetchUser          = ()                     => req('GET',  '/api/user');
export const fetchWallet        = ()                     => req('GET',  '/api/wallet');

// ── Orders ────────────────────────────────────────────────────────────────
export const fetchOrders        = ()                     => req('GET',  '/api/orders');
export const placeOrder         = (product, amount)      => req('POST', '/api/orders', { product, amount });

// ── Cart ──────────────────────────────────────────────────────────────────
export const fetchCart          = ()                     => req('GET',    '/api/cart');
export const addCartItem        = (product_id, quantity) => req('POST',   '/api/cart',              { product_id, quantity });
export const updateCartItem     = (product_id, quantity) => req('PUT',    `/api/cart/${product_id}`, { quantity });
export const deleteCartItem     = (product_id)           => req('DELETE', `/api/cart/${product_id}`);
export const clearCart          = ()                     => req('DELETE', '/api/cart');

// ── Wishlist ──────────────────────────────────────────────────────────────
export const fetchWishlist      = ()                     => req('GET', '/api/wishlist');

// ── Tickets ───────────────────────────────────────────────────────────────
export const fetchTickets       = ()                     => req('GET',  '/api/tickets');
export const fetchAllTickets    = ()                     => req('GET',  '/api/admin/tickets');
export const resolveTicket      = (id, action='approved')=> req('POST', `/api/admin/tickets/${id}/resolve`, { action });

// ── Chat history ──────────────────────────────────────────────────────────
export const fetchChatHistory   = ()                     => req('GET', '/api/chat-history');

// ── CRM leads (Airtable, via backend proxy) ──────────────────────────────
export const fetchLeads         = ()                     => req('GET', '/api/leads');
