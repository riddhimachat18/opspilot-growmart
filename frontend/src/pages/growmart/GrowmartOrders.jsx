import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, MessageCircle } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', ink4:'#B8AFA6', accent:'#E8520A' };

const STATUS_STYLE = {
  Delivered:  { bg: '#ECFDF5', text: '#15803D' },
  delivered:  { bg: '#ECFDF5', text: '#15803D' },
  Processing: { bg: '#EFF4FF', text: '#1D4ED8' },
  processing: { bg: '#EFF4FF', text: '#1D4ED8' },
  Delayed:    { bg: '#FFFBEB', text: '#B45309' },
  delayed:    { bg: '#FFFBEB', text: '#B45309' },
  Refunded:   { bg: '#F5F3FF', text: '#6D28D9' },
  refunded:   { bg: '#F5F3FF', text: '#6D28D9' },
};

export default function GrowmartOrders() {
  const navigate = useNavigate();
  const { orders, addItemById, creditWallet } = useStore();
  const [autoMessage, setAutoMessage] = useState(null);

  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 32px' }}>
        <button onClick={() => navigate('/growmart')}
          style={{ background:'none',border:'none',cursor:'pointer',color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:5,marginBottom:28,padding:0 }}>
          <ArrowLeft size={13}/> Back to store
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:24,letterSpacing:'-0.03em',color:GM.ink1,margin:'0 0 4px' }}>Your orders</h1>
          <p style={{ color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',margin:0 }}>{orders.length} orders · Aditi Sharma</p>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign:'center',padding:'64px 24px' }}>
            <Package size={40} style={{ color:GM.ink4,marginBottom:14 }} />
            <p style={{ color:GM.ink3,fontSize:14,fontFamily:'Inter,sans-serif' }}>No orders yet. Start shopping!</p>
            <button onClick={() => navigate('/growmart/products')} style={{ marginTop:16,backgroundColor:GM.accent,color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif' }}>Shop now</button>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {orders.map(order => {
              const orderId = order.order_id || order.id;
              const orderProduct = order.product || order.product_name || '';
              const orderAmount = order.amount || 0;
              const orderDate = order.order_date || order.date || '';
              const orderStatus = order.status || '';
              const ss = STATUS_STYLE[orderStatus] ?? { bg:GM.base, text:GM.ink2 };
              const isDelivered = orderStatus.toLowerCase() === 'delivered';
              return (
                <div key={orderId} style={{ backgroundColor:GM.surface,border:`1px solid ${GM.border}`,borderRadius:12,padding:'18px 20px' }}>
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:12 }}>
                    <div>
                      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:4 }}>
                        <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,color:GM.ink1 }}>{orderId}</span>
                        <span style={{ backgroundColor:ss.bg,color:ss.text,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,fontFamily:'Inter,sans-serif',textTransform:'uppercase',letterSpacing:'0.05em' }}>{orderStatus}</span>
                      </div>
                      <div style={{ color:GM.ink2,fontSize:14,fontFamily:'Inter,sans-serif' }}>{orderProduct}</div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:16,color:GM.ink1 }}>₹{Number(orderAmount).toLocaleString('en-IN')}</div>
                      <div style={{ color:GM.ink3,fontSize:11,fontFamily:'Inter,sans-serif',marginTop:2 }}>{orderDate}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:8,borderTop:`1px solid ${GM.border}`,paddingTop:12 }}>
                    <button
                      onClick={() => setAutoMessage(`I have a question about order ${orderId} — ${orderProduct}.`)}
                      style={{ background:'none',border:`1px solid ${GM.border}`,borderRadius:8,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif',color:GM.ink2,display:'flex',alignItems:'center',gap:6 }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=GM.accent;e.currentTarget.style.color=GM.accent;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=GM.border;e.currentTarget.style.color=GM.ink2;}}>
                      <MessageCircle size={12}/> Get help
                    </button>
                    {isDelivered && (
                      <button
                        onClick={() => setAutoMessage(`I'd like a refund for order ${orderId}.`)}
                        style={{ background:'none',border:`1px solid ${GM.border}`,borderRadius:8,padding:'6px 14px',fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif',color:GM.ink2 }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='#DC2626';e.currentTarget.style.color='#DC2626';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=GM.border;e.currentTarget.style.color=GM.ink2;}}>
                        Request refund
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <OpsPilotWidget autoMessage={autoMessage} onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}
