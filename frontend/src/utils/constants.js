export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chat';

// ── Agent metadata ── used across dark (admin/widget) surfaces
export const AGENT_META = {
  orchestrator:     { label: 'Orchestrator', hex: '#8899BB', bg: 'rgba(136,153,187,0.12)', ruleClass: 'trace-rule-orchestrator' },
  sales_agent:      { label: 'Sales',        hex: '#4F6EF7', bg: 'rgba(79,110,247,0.12)',  ruleClass: 'trace-rule-sales' },
  support_agent:    { label: 'Support',      hex: '#34D399', bg: 'rgba(52,211,153,0.12)',  ruleClass: 'trace-rule-support' },
  care_agent:       { label: 'Care',         hex: '#C084FC', bg: 'rgba(192,132,252,0.12)', ruleClass: 'trace-rule-care' },
  scheduling_agent: { label: 'Scheduling',   hex: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  ruleClass: 'trace-rule-scheduling' },
};
export const AGENT_META_DEFAULT = { label: 'Agent', hex: '#8899BB', bg: 'rgba(136,153,187,0.12)', ruleClass: 'trace-rule-default' };
export const getAgentMeta = (name) => AGENT_META[name] ?? AGENT_META_DEFAULT;

// ── Demo scenario prompts ──
export const DEMO_SCENARIOS = [
  { label: 'Sales — Product advice',       prompt: "Hi, I'm looking for a wireless charger for my iPhone 15. Budget around ₹1500." },
  { label: 'Support — Order tracking',     prompt: 'My order #GM-10234 was due two days ago. Can you check on it?' },
  { label: 'Support — Troubleshooting',    prompt: "My GrowMart SmartPlug won't connect to WiFi. I've tried restarting it three times." },
  { label: 'Care — Refund request',        prompt: "I'd like a refund for order #GM-10237. The charger stopped working after a week." },
  { label: 'Care — Refund request 2',      prompt: "I'd like a refund for order #GM-10239. The SmartPlug arrived damaged." },
  { label: 'Scheduling — Callback',        prompt: 'I need to speak to someone about a billing issue. Can you book a callback?' },
];

// ── GrowMart product catalog ──
export const PRODUCTS = [
  {
    id: 'magcharge-15w',
    name: 'MagCharge 15W',
    tagline: 'Wireless Charger',
    price: 1499,
    badge: 'New',
    inStock: true,
    features: ['15W fast charging', 'Case-friendly Qi', 'LED charge indicator', 'Overheat protection'],
    compatible: ['iPhone 12–15 series', 'AirPods Pro', 'Samsung Galaxy S21+'],
    description: 'MagAlign technology snaps to position in a fraction of a second. Charges through cases up to 5mm thick. Ships with a 1.5m braided USB-C cable.',
    emoji: '🔋',
    color: '#4F6EF7',
  },
  {
    id: 'smartplug-duo',
    name: 'SmartPlug Duo Pack',
    tagline: 'Wi-Fi Smart Plugs',
    price: 899,
    badge: 'Bestseller',
    inStock: true,
    features: ['2.4 GHz Wi-Fi', 'Voice control ready', 'Energy monitoring', 'Schedule & timer'],
    compatible: ['Alexa', 'Google Home', 'GrowMart App'],
    description: 'Turn any outlet smart. Monitor energy consumption in real time, set schedules, and control remotely from the GrowMart app. Pack of two.',
    emoji: '🔌',
    color: '#34D399',
  },
  {
    id: 'echobuds-pro',
    name: 'EchoBuds Pro',
    tagline: 'True Wireless Earbuds',
    price: 1999,
    badge: null,
    inStock: true,
    features: ['Active Noise Cancellation', '28h total battery', 'IPX5 water resistant', 'Dual mic call clarity'],
    compatible: ['iOS', 'Android', 'GrowMart App'],
    description: 'ANC that actually works in crowded spaces. 7h playback per charge, 21h from the case. Transparency mode for situational awareness.',
    emoji: '🎧',
    color: '#C084FC',
  },
  {
    id: 'smartwatch-s2',
    name: 'SmartWatch Series 2',
    tagline: 'Fitness & Health',
    price: 3499,
    badge: null,
    inStock: true,
    features: ['Blood oxygen monitoring', 'Sleep tracking', '5 ATM water resistance', '7-day battery'],
    compatible: ['iOS 14+', 'Android 8+'],
    description: 'All-day health tracking with always-on display. Tracks 15+ workout modes, monitors SpO2 and heart rate continuously. Comes with two band options.',
    emoji: '⌚',
    color: '#FBBF24',
  },
  {
    id: 'led-strip-5m',
    name: 'LED Strip 5M',
    tagline: 'Smart Ambient Lighting',
    price: 799,
    badge: 'Popular',
    inStock: true,
    features: ['16M colour RGBIC', 'Music sync mode', 'App & voice control', 'Cuttable every 10cm'],
    compatible: ['Alexa', 'Google Home', 'GrowMart App'],
    description: 'Adhesive-backed strip cuts to any length. Music sync responds to beats in real time. Scene presets for gaming, reading, and movies.',
    emoji: '💡',
    color: '#E8520A',
  },
  {
    id: 'powerbank-20k',
    name: 'PowerVault 20K',
    tagline: 'Portable Power Bank',
    price: 1299,
    badge: null,
    inStock: false,
    features: ['20,000 mAh', '65W USB-C PD', 'Three simultaneous ports', 'Digital display'],
    compatible: ['Laptops via USB-C', 'All phones', 'Tablets'],
    description: 'Enough capacity to charge a MacBook Air once and an iPhone four times. Digital readout shows exact percentage remaining.',
    emoji: '🔋',
    color: '#8899BB',
  },
];

// ── Admin dashboard stats ──
export const MOCK_STATS = {
  totalConversations: 248,
  resolutionRate: 87,
  avgHandlingTime: '1m 42s',
  escalationRate: 13,
  hoursSaved: 41,
};

export const MOCK_AGENT_DISTRIBUTION = [
  { agent: 'Sales',      count: 68,  color: '#4F6EF7' },
  { agent: 'Support',    count: 112, color: '#34D399' },
  { agent: 'Care',       count: 47,  color: '#C084FC' },
  { agent: 'Scheduling', count: 21,  color: '#FBBF24' },
];

export const MOCK_RECENT_ACTIVITY = [
  { time: '13:42', agent: 'support_agent',    summary: 'WiFi troubleshooting resolved via KB',           outcome: 'resolved'  },
  { time: '13:38', agent: 'sales_agent',      summary: 'Lead created — Aditi Sharma (MagCharge 15W)',    outcome: 'lead'      },
  { time: '13:31', agent: 'care_agent',       summary: 'Refund issued — ₹899 (Order #GM-10237)',         outcome: 'resolved'  },
  { time: '13:19', agent: 'scheduling_agent', summary: 'Callback booked — Rohan Verma, Jul 14 10:00',   outcome: 'booked'    },
  { time: '13:11', agent: 'support_agent',    summary: 'Return policy query — self-service resolved',    outcome: 'resolved'  },
  { time: '12:58', agent: 'care_agent',       summary: 'Refund escalated — ₹3,200 (over threshold)',    outcome: 'escalated' },
];

// ── Admin tickets ──
export const MOCK_TICKETS = [
  {
    id: 'TKT-001',
    customer: 'Priya Nair',
    email: 'priya@example.com',
    issue: 'Refund request — SmartWatch Series 2 (₹3,499) — over auto-approval threshold',
    agent: 'care_agent',
    status: 'escalated',
    timestamp: '13:22',
    orderId: 'GM-10241',
    amount: 3499,
    transcript: [
      { role: 'user',      text: "I want a refund for my order #GM-10241. The SmartWatch stopped syncing after 3 days." },
      { role: 'assistant', text: "I'm sorry to hear that, Priya. I've looked up order #GM-10241 — a SmartWatch Series 2 delivered on Jul 9. Since this is above our ₹500 auto-approval limit, I've flagged this for a team member to review and approve. You'll hear back within 2 hours." },
    ],
    trace: [
      { agent: 'orchestrator',  status: 'done',      action: 'Classified intent — Care',          detail: null },
      { agent: 'care_agent',    status: 'tool_call',  action: 'lookup_order("GM-10241")',          detail: '→ ₹3,499 | Delivered Jul 9' },
      { agent: 'care_agent',    status: 'escalated',  action: 'Amount exceeds ₹500 threshold',    detail: 'Routed to human review queue' },
    ],
  },
  {
    id: 'TKT-002',
    customer: 'Suresh Pillai',
    email: 'suresh@example.com',
    issue: 'Delayed order — SmartPlug Duo Pack — 4 days past estimated delivery',
    agent: 'support_agent',
    status: 'pending',
    timestamp: '12:47',
    orderId: 'GM-10243',
    amount: 899,
    transcript: [
      { role: 'user',      text: "My order #GM-10243 hasn't arrived. It was supposed to come on July 10." },
      { role: 'assistant', text: "I can see order #GM-10243 is marked as delayed — the courier shows it's in transit but past the estimated delivery window. I've raised an investigation with our shipping partner and will update you by email within 24 hours." },
    ],
    trace: [
      { agent: 'orchestrator',  status: 'done',      action: 'Classified intent — Support',        detail: null },
      { agent: 'support_agent', status: 'tool_call',  action: 'lookup_order("GM-10243")',          detail: '→ Status: Delayed | In transit' },
      { agent: 'support_agent', status: 'done',       action: 'Shipping investigation raised',    detail: null },
    ],
  },
  {
    id: 'TKT-003',
    customer: 'Meera Joshi',
    email: 'meera@example.com',
    issue: 'Callback scheduled — billing dispute, agent requested human confirmation',
    agent: 'scheduling_agent',
    status: 'pending',
    timestamp: '11:55',
    orderId: null,
    amount: null,
    transcript: [
      { role: 'user',      text: "I was charged twice for the same order. I need someone to call me." },
      { role: 'assistant', text: "I've noted the duplicate charge concern for your account. A support specialist is available tomorrow at 10:00 AM or 2:00 PM. Which works for you?" },
      { role: 'user',      text: "10 AM is fine." },
      { role: 'assistant', text: "Booked. You'll get a calendar confirmation at meera@example.com. The agent will have your order history on hand." },
    ],
    trace: [
      { agent: 'orchestrator',     status: 'done',     action: 'Classified intent — Scheduling',     detail: null },
      { agent: 'scheduling_agent', status: 'tool_call', action: 'get_available_slots()',             detail: '→ Jul 14 10:00, 14:00 | Jul 15 11:00' },
      { agent: 'scheduling_agent', status: 'done',      action: 'book_slot("Jul 14 10:00", meera@example.com)', detail: 'Calendar event created' },
    ],
  },
];

// ── CRM leads ──
export const MOCK_LEADS = [
  { id: 1, name: 'Aditi Sharma',  email: 'aditi@example.com',  interest: 'MagCharge 15W',       stage: 'Contacted', notes: 'Home charging station bundle',   createdAt: '2026-07-12' },
  { id: 2, name: 'Rohan Verma',   email: 'rohan@example.com',  interest: 'SmartPlug Duo Pack',  stage: 'Qualified', notes: 'Home automation, 3-room flat',    createdAt: '2026-07-11' },
  { id: 3, name: 'Priya Nair',    email: 'priya@example.com',  interest: 'EchoBuds Pro',        stage: 'New',       notes: 'Gift under ₹2000',                createdAt: '2026-07-13' },
  { id: 4, name: 'Karan Mehta',   email: 'karan@example.com',  interest: 'LED Strip 5M',        stage: 'Contacted', notes: 'Gaming room setup',               createdAt: '2026-07-10' },
  { id: 5, name: 'Sneha Iyer',    email: 'sneha@example.com',  interest: 'SmartWatch Series 2', stage: 'New',       notes: 'Comparing with Noise ColorFit',   createdAt: '2026-07-13' },
];

// ── KB articles ──
export const KB_ARTICLES = [
  { id: 1,  title: 'Shipping policy & timelines',          tags: ['shipping','delivery'],      excerpt: 'Standard delivery takes 3–5 business days. Express (1–2 days) available at checkout for most pin codes.' },
  { id: 2,  title: 'Track your order',                     tags: ['tracking','order'],         excerpt: 'Use the tracking link emailed after dispatch. Orders are trackable within 24h of shipping.' },
  { id: 3,  title: 'Delayed or lost order',                tags: ['delay','lost','shipping'],  excerpt: 'If your order is 3+ days past the estimated delivery, contact support with your order ID for an investigation.' },
  { id: 4,  title: 'Return policy',                        tags: ['returns','policy'],         excerpt: '10-day return window from delivery. Item must be unused, in original packaging. Initiate via the app or chat.' },
  { id: 5,  title: 'Refund timelines',                     tags: ['refund','payments'],        excerpt: 'Approved refunds reach your original payment method in 3–5 business days.' },
  { id: 6,  title: 'Non-returnable items',                 tags: ['returns','policy'],         excerpt: 'Personalised items, opened earbuds, and clearance products cannot be returned.' },
  { id: 7,  title: 'Warranty coverage',                    tags: ['warranty'],                 excerpt: '1-year manufacturer warranty on all GrowMart branded products. Covers manufacturing defects, not physical damage.' },
  { id: 8,  title: 'How to claim warranty',                tags: ['warranty','support'],       excerpt: 'Chat with support, provide your order ID and a photo of the defect. Replacement dispatched within 48h if approved.' },
  { id: 9,  title: 'SmartPlug WiFi troubleshooting',       tags: ['smartplug','wifi','setup'], excerpt: 'Ensure your router is on 2.4 GHz. Hold the reset button for 5 seconds until the LED flashes rapidly, then re-pair.' },
  { id: 10, title: 'SmartPlug factory reset',              tags: ['smartplug','reset'],        excerpt: 'Press and hold the button for 10 seconds until the LED turns solid red. Release and wait 30 seconds.' },
  { id: 11, title: 'MagCharge slow charging fix',          tags: ['charger','wireless'],       excerpt: 'Remove thick metal cases. Ensure USB-C adapter is at least 18W. Place phone centrally on the pad.' },
  { id: 12, title: 'EchoBuds pairing issues',              tags: ['echobuds','bluetooth'],     excerpt: 'Forget the device in Bluetooth settings, place buds in case for 10 seconds, then hold the case button to re-pair.' },
  { id: 13, title: 'SmartWatch battery & sync issues',     tags: ['smartwatch','battery'],     excerpt: 'Force-close the GrowMart app and reopen. If sync fails, toggle Bluetooth off and on. Battery drain often from always-on display.' },
  { id: 14, title: 'LED strip installation guide',         tags: ['led','setup'],              excerpt: 'Clean surface with alcohol wipe before adhering. Do not bend at angles sharper than 90°. Connect to app before mounting.' },
  { id: 15, title: 'Cancel or modify an order',            tags: ['order','cancel'],           excerpt: 'Orders can be cancelled within 2 hours of placement via the app. After dispatch, initiate a return upon delivery.' },
  { id: 16, title: 'Change shipping address',              tags: ['order','shipping'],         excerpt: 'Address changes are possible before dispatch only. Contact support immediately with your order ID.' },
  { id: 17, title: 'Apply coupon or promo code',           tags: ['discount','coupon'],        excerpt: 'Enter your code at checkout in the "Promo code" field. Codes cannot be applied after an order is placed.' },
  { id: 18, title: 'Payment methods & failed payments',    tags: ['payments'],                 excerpt: 'We accept UPI, cards, net banking, and wallets. If a payment fails, the amount is auto-refunded in 2–3 days.' },
  { id: 19, title: 'Account login & password reset',       tags: ['account'],                  excerpt: 'Use "Forgot password" on the login screen. A reset link is sent to your registered email within a minute.' },
  { id: 20, title: 'Membership & pricing tiers',           tags: ['membership','pricing'],     excerpt: 'GrowMart Plus members get free express shipping and 5% back on every order. ₹299/year or ₹49/month.' },
];
