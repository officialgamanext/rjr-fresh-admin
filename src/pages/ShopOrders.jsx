import React, { useState, useEffect } from 'react';
import { Search, Loader2, Store, Edit2 } from 'lucide-react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const ShopOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // We fetch all orders and then sort locally since composite indexes may not be available.
    // Given orderBy might fail without indexes, let's fetch without orderBy and sort.
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching shop orders:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
  const totalReceived = orders.reduce((sum, o) => sum + (parseFloat(o.paymentReceived) || 0), 0);
  const totalPending = Math.max(0, totalRevenue - totalReceived);

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store color="var(--primary-color)" /> Shop Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage all B2B orders</p>
        </div>
      </div>

      <div className="analytics-top-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Total Orders</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0c4a6e' }}>{totalOrders}</div>
        </div>
        <div className="card" style={{ padding: '20px', backgroundColor: '#ffedd5', border: '1px solid #fed7aa', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#c2410c', fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c2d12' }}>₹{Math.round(totalRevenue)}</div>
        </div>
        <div className="card" style={{ padding: '20px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>Payment Received</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d' }}>₹{Math.round(totalReceived)}</div>
        </div>
        <div className="card" style={{ padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600, textTransform: 'uppercase' }}>Payment Pending</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#7f1d1d' }}>₹{Math.round(totalPending)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Search orders by ID, Shop or Status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>ORDER ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>SHOP</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>DATE</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>TOTAL</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>STATUS</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}><Loader2 className="spinner" size={24} color="var(--primary-color)" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No orders found.</td></tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{order.shopName}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>₹{order.grandTotal}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`status-badge status-${order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : 'warning'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => navigate(`/shops/${order.shopId}`)}
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit2 size={14} /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopOrders;
