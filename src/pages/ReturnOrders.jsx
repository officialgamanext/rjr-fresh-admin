import React, { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw, Plus } from 'lucide-react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import ReturnModal from '../components/modals/ReturnModal';

const ReturnOrders = () => {
  const navigate = useNavigate();
  const { selectedLocation } = useLocationContext();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetch all returns sorted by createdAt desc
    const q = query(collection(db, 'returns'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by selected location context
      // Note: older return records might not have locationId, they won't show unless location is 'all'
      const filteredData = selectedLocation === 'all' 
        ? data 
        : data.filter(ret => ret.locationId === selectedLocation);
        
      setReturns(filteredData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching returns:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedLocation]);

  const filteredReturns = returns.filter(ret => 
    ret.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ret.shopName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Analytics
  const totalReturnOrders = filteredReturns.length;
  const totalItemsReturned = filteredReturns.reduce((sum, ret) => sum + (ret.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0);
  const totalRefundValue = filteredReturns.reduce((sum, ret) => sum + (parseFloat(ret.totalRefund) || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw color="var(--primary-color)" /> Return Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage all shop returns</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsReturnModalOpen(true)}
            style={{ display: 'flex', minWidth: 'fit-content', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600 }}
          >
            <Plus size={18} /> Add Return
          </button>
        </div>
      </div>

      <div className="analytics-top-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', boxShadow: 'none' }}>
          <span style={{ fontSize: '13px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 700 }}>Total Return Orders</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#0c4a6e', marginTop: '8px' }}>{totalReturnOrders}</span>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#fef3c7', border: '1px solid #fde68a', boxShadow: 'none' }}>
          <span style={{ fontSize: '13px', color: '#b45309', textTransform: 'uppercase', fontWeight: 700 }}>Total Items Returned</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#78350f', marginTop: '8px' }}>{totalItemsReturned}</span>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
          <span style={{ fontSize: '13px', color: '#15803d', textTransform: 'uppercase', fontWeight: 700 }}>Total Refund Value</span>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#14532d', marginTop: '8px' }}>₹{(totalRefundValue || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Search by Order ID or Shop..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px', height: '40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontSize: '12px', fontWeight: 700 }}>ORDER ID</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontSize: '12px', fontWeight: 700 }}>SHOP NAME</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontSize: '12px', fontWeight: 700 }}>DATE</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#475569', fontSize: '12px', fontWeight: 700 }}>ITEMS RETURNED</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#475569', fontSize: '12px', fontWeight: 700 }}>REFUND VALUE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" size={24} color="var(--primary-color)" /></td></tr>
              ) : filteredReturns.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No return orders found.</td></tr>
              ) : filteredReturns.map(ret => (
                <tr key={ret.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>#{ret.orderId.slice(-6).toUpperCase()}</td>
                  <td 
                    style={{ padding: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--primary-color)' }}
                    onClick={() => navigate(`/shops/${ret.shopId}`)}
                    title="View Shop Details"
                  >
                    {ret.shopName}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{new Date(ret.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                      {ret.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0} items
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-color)' }}>₹{ret.totalRefund}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReturnModal 
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        shop={null}
      />
    </div>
  );
};

export default ReturnOrders;
