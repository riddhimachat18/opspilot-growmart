-- ============================================================
-- GrowMart × OpsPilot — Supabase schema
-- Paste into: Supabase dashboard → SQL Editor → New query → Run
-- ============================================================

-- Users / profiles
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    avatar      TEXT NOT NULL DEFAULT 'AS',
    wallet      NUMERIC NOT NULL DEFAULT 5000.0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders (Care Agent lookups, customer order history)
CREATE TABLE IF NOT EXISTS orders (
    order_id       TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id),
    product        TEXT NOT NULL,
    amount         NUMERIC NOT NULL,
    status         TEXT NOT NULL DEFAULT 'delivered',
    order_date     TEXT NOT NULL,
    refund_id      TEXT,
    refunded_at    TIMESTAMPTZ,
    customer_name  TEXT,
    customer_email TEXT
);

-- Cart (persists across sessions)
CREATE TABLE IF NOT EXISTS cart (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     TEXT NOT NULL REFERENCES users(id),
    product_id  TEXT NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     TEXT NOT NULL REFERENCES users(id),
    product_id  TEXT NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Support / escalation tickets
CREATE TABLE IF NOT EXISTS tickets (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id),
    order_id       TEXT,
    issue          TEXT NOT NULL,
    agent          TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending',
    amount         NUMERIC,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at    TIMESTAMPTZ,
    transcript     JSONB,
    trace          JSONB
);

-- Chat history (one row per conversation turn summary)
CREATE TABLE IF NOT EXISTS chat_history (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     TEXT NOT NULL REFERENCES users(id),
    summary     TEXT NOT NULL,
    agent       TEXT NOT NULL,
    outcome     TEXT NOT NULL,
    preview     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallet transactions ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     TEXT NOT NULL REFERENCES users(id),
    type        TEXT NOT NULL,   -- 'credit' | 'debit'
    amount      NUMERIC NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Seed data ─────────────────────────────────────────────────

INSERT INTO users (id, name, email, avatar, wallet)
VALUES ('user-aditi', 'Aditi Sharma', 'aditi@example.com', 'AS', 5000.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (order_id, user_id, product, amount, status, order_date, customer_name, customer_email) VALUES
('GM-10234', 'user-aditi', 'SmartPlug Duo Pack',              899.0,  'delivered',  '2026-07-03', 'Aditi Sharma', 'aditi@example.com'),
('GM-10235', 'user-aditi', 'MagCharge 15W Wireless Charger',  1499.0, 'delivered',  '2026-07-05', 'Aditi Sharma', 'aditi@example.com'),
('GM-10241', 'user-aditi', 'PowerVault 20K',                  1199.0, 'delivered',  '2026-07-11', 'Aditi Sharma', 'aditi@example.com'),
('GM-10236', 'user-aditi', 'EchoBuds Pro',                    2299.0, 'delivered',  '2026-07-06', 'Priya Nair',   'priya@example.com'),
('GM-10237', 'user-aditi', 'SmartWatch Fit',                  3499.0, 'delivered',  '2026-07-08', 'Karan Mehta',  'karan@example.com'),
('GM-10238', 'user-aditi', 'LED Strip 5M',                     999.0, 'delivered',  '2026-07-09', 'Sneha Iyer',   'sneha@example.com'),
('GM-10239', 'user-aditi', 'SmartPlug Single',                 549.0, 'delayed',    '2026-07-10', 'Vikram Rao',   'vikram@example.com'),
('GM-10240', 'user-aditi', 'SmartWatch + EchoBuds Bundle',    5798.0, 'delivered',  '2026-07-04', 'Neha Kapoor',  'neha@example.com'),
('GM-10242', 'user-aditi', 'USB-C Fast Charger 65W',          1299.0, 'processing', '2026-07-12', 'Meera Joshi',  'meera@example.com'),
('GM-10243', 'user-aditi', 'Bluetooth Speaker Mini',          1799.0, 'delivered',  '2026-07-07', 'Farhan Ali',   'farhan@example.com')
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO wishlist (user_id, product_id) VALUES
('user-aditi', 'echobuds-pro'),
('user-aditi', 'smartwatch-s2')
ON CONFLICT (user_id, product_id) DO NOTHING;

INSERT INTO tickets (id, user_id, order_id, issue, agent, status, amount, transcript, trace) VALUES
(
  'TKT-001', 'user-aditi', 'GM-10241',
  'Refund request — SmartWatch Series 2 stopped syncing after 3 days',
  'care_agent', 'escalated', 3499.0,
  '[{"role":"user","text":"I want a refund for my order #GM-10241. The SmartWatch stopped syncing after 3 days."},{"role":"assistant","text":"I''m sorry to hear that. Since this is above our ₹1,500 auto-approval limit, I''ve flagged it for a team member to review. You''ll hear back within 2 hours."}]'::jsonb,
  '[{"agent":"orchestrator","status":"done","action":"classified intent → care"},{"agent":"care_agent","status":"tool_call","action":"lookup_order(\"GM-10241\")","detail":"→ ₹3,499 | Delivered Jul 11"},{"agent":"care_agent","status":"escalated","action":"Amount exceeds ₹1,500 threshold","detail":"Routed to human review queue"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat_history (user_id, summary, agent, outcome, preview, created_at) VALUES
('user-aditi', 'Asked about MagCharge 15W compatibility with phone cases', 'sales_agent',   'Purchased', 'Agent recommended MagCharge 15W — works with cases up to 3mm.',             '2026-07-05T14:22:00Z'),
('user-aditi', 'SmartPlug WiFi troubleshooting',                          'support_agent', 'Resolved',  'Issue resolved with 2.4GHz band switch via KB article.',                   '2026-07-08T11:05:00Z'),
('user-aditi', 'Refund request for SmartPlug Duo Pack (GM-10234)',        'care_agent',    'Refunded',  'Refund of ₹899 issued. Reflects in wallet within 5–7 days.',                '2026-07-11T09:47:00Z');

-- ── Row Level Security (disable for demo — re-enable for production) ──────────
ALTER TABLE users                DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders               DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist             DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets              DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history         DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions  DISABLE ROW LEVEL SECURITY;
