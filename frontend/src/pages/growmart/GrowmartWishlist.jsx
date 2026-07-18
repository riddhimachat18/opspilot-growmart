import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingCart } from 'lucide-react';
import GrowmartHeader from '../../components/growmart/GrowmartHeader';
import OpsPilotWidget from '../../components/widget/OpsPilotWidget';
import { useStore } from '../../context/StoreContext';

const GM = { base:'#FAFAF8', surface:'#FFFFFF', border:'#E5E0D8', ink1:'#1A1410', ink2:'#4A3F35', ink3:'#8C7B6E', ink4:'#B8AFA6', accent:'#E8520A' };

export default function GrowmartWishlist() {
  const navigate = useNavigate();
  const { wishlist, addItem, addItemById, creditWallet } = useStore();

  return (
    <div style={{ backgroundColor: GM.base, minHeight: '100%' }}>
      <GrowmartHeader />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 32px' }}>
        <button onClick={() => navigate('/growmart')}
          style={{ background:'none',border:'none',cursor:'pointer',color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:5,marginBottom:28,padding:0 }}>
          <ArrowLeft size={13}/> Back to store
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:24,letterSpacing:'-0.03em',color:GM.ink1,margin:'0 0 4px' }}>Wishlist</h1>
          <p style={{ color:GM.ink3,fontSize:13,fontFamily:'Inter,sans-serif',margin:0 }}>{wishlist.length} saved items</p>
        </div>

        {wishlist.length === 0 ? (
          <div style={{ textAlign:'center',padding:'64px 24px' }}>
            <Heart size={40} style={{ color:GM.ink4,marginBottom:14 }} />
            <p style={{ color:GM.ink3,fontSize:14,fontFamily:'Inter,sans-serif' }}>Nothing saved yet. Browse products and save what you like.</p>
            <button onClick={() => navigate('/growmart/products')} style={{ marginTop:16,backgroundColor:GM.accent,color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif' }}>Browse products</button>
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16 }}>
            {wishlist.map(product => (
              <div key={product.id} style={{ backgroundColor:GM.surface,border:`1px solid ${GM.border}`,borderRadius:12,overflow:'hidden' }}>
                <div
                  onClick={() => navigate(`/growmart/products/${product.id}`)}
                  style={{ height:140,backgroundColor:product.color+'18',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative' }}>
                  <span style={{ fontSize:52 }}>{product.emoji}</span>
                  <div style={{ position:'absolute',top:10,right:10 }}>
                    <Heart size={16} fill={GM.accent} color={GM.accent} />
                  </div>
                </div>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ color:GM.ink3,fontSize:11,fontFamily:'Inter,sans-serif',marginBottom:3 }}>{product.tagline}</div>
                  <div style={{ color:GM.ink1,fontSize:14,fontWeight:700,fontFamily:'DM Sans,sans-serif',letterSpacing:'-0.02em',marginBottom:10 }}>{product.name}</div>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                    <span style={{ color:GM.ink1,fontSize:15,fontWeight:700,fontFamily:'DM Sans,sans-serif' }}>₹{product.price.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => { addItem(product); navigate('/growmart/cart'); }}
                    disabled={!product.inStock}
                    style={{ width:'100%',backgroundColor:product.inStock?GM.accent:'#E5E0D8',color:product.inStock?'#fff':GM.ink3,border:'none',borderRadius:8,padding:'8px',fontSize:12,fontWeight:600,cursor:product.inStock?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                    <ShoppingCart size={13}/>
                    {product.inStock?'Add to cart':'Out of stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <OpsPilotWidget onCartUpdate={addItemById} onRefund={creditWallet} />
    </div>
  );
}
