import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminGuard       from './components/AdminGuard';
import MarketingPage    from './pages/MarketingPage';

// GrowMart storefront
import GrowmartHome        from './pages/growmart/GrowmartHome';
import GrowmartProducts    from './pages/growmart/GrowmartProducts';
import GrowmartProduct     from './pages/growmart/GrowmartProduct';
import GrowmartCart        from './pages/growmart/GrowmartCart';
import GrowmartCheckout    from './pages/growmart/GrowmartCheckout';
import GrowmartOrders      from './pages/growmart/GrowmartOrders';
import GrowmartWishlist    from './pages/growmart/GrowmartWishlist';
import GrowmartChatHistory from './pages/growmart/GrowmartChatHistory';
import GrowmartOpenTickets from './pages/growmart/GrowmartOpenTickets';

// Admin console
import AdminLogin     from './pages/admin/AdminLogin';
import AdminShell     from './pages/admin/AdminShell';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTickets   from './pages/admin/AdminTickets';
import AdminCRM       from './pages/admin/AdminCRM';
import AdminKB        from './pages/admin/AdminKB';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Marketing site ──────────────────────────────────── */}
        <Route path="/" element={<MarketingPage />} />

        {/* ── GrowMart storefront ─────────────────────────────── */}
        <Route path="/growmart"                element={<GrowmartHome />} />
        <Route path="/growmart/products"       element={<GrowmartProducts />} />
        <Route path="/growmart/products/:id"   element={<GrowmartProduct />} />
        <Route path="/growmart/cart"           element={<GrowmartCart />} />
        <Route path="/growmart/checkout"       element={<GrowmartCheckout />} />
        <Route path="/growmart/orders"         element={<GrowmartOrders />} />
        <Route path="/growmart/wishlist"       element={<GrowmartWishlist />} />
        <Route path="/growmart/chat-history"   element={<GrowmartChatHistory />} />
        <Route path="/growmart/tickets"        element={<GrowmartOpenTickets />} />

        {/* ── Admin login (public) ────────────────────────────── */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* ── Admin shell — gated by AdminGuard ───────────────── */}
        <Route path="/admin/*" element={<AdminGuard><AdminShell /></AdminGuard>}>
          <Route index            element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tickets"   element={<AdminTickets />} />
          <Route path="crm"       element={<AdminCRM />} />
          <Route path="kb"        element={<AdminKB />} />
        </Route>

        {/* ── Fallback ────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
