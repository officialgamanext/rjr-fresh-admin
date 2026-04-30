import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Store, User, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import CustomDropdown from '../components/CustomDropdown';

const dateOptions = [
  { value: 'Today', label: 'Today' },
  { value: 'Yesterday', label: 'Yesterday' },
  { value: 'This Week', label: 'This Week' },
  { value: 'Last Week', label: 'Last Week' },
  { value: 'This Month', label: 'This Month' },
  { value: 'Last Month', label: 'Last Month' },
  { value: 'This Year', label: 'This Year' },
  { value: 'Last Year', label: 'Last Year' },
  { value: 'Custom', label: 'Custom Date' }
];

const Payments = () => {
  const [dateFilter, setDateFilter] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [shopOrders, setShopOrders] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('shopOrders');

  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    switch(filter) {
      case 'Today':
        return { start: today, end: endOfToday };
      case 'Yesterday': {
        const start = new Date(today);
        start.setDate(today.getDate() - 1);
        const end = new Date(endOfToday);
        end.setDate(endOfToday.getDate() - 1);
        return { start, end };
      }
      case 'This Week': {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay()); 
        return { start, end: endOfToday };
      }
      case 'Last Week': {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - 7);
        const end = new Date(endOfToday);
        end.setDate(today.getDate() - today.getDay() - 1);
        return { start, end };
      }
      case 'This Month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start, end: endOfToday };
      }
      case 'Last Month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        return { start, end };
      }
      case 'This Year': {
        const start = new Date(today.getFullYear(), 0, 1);
        return { start, end: endOfToday };
      }
      case 'Last Year': {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { start, end };
      }
      default:
        return { start: null, end: null };
    }
  };

  useEffect(() => {
    let startIso, endIso;
    if (dateFilter === 'Custom') {
       if (customStart && customEnd) {
         startIso = new Date(customStart).toISOString();
         const endD = new Date(customEnd);
         endD.setHours(23, 59, 59, 999);
         endIso = endD.toISOString();
       }
    } else {
       const { start, end } = getDateRange(dateFilter);
       if (start && end) {
         startIso = start.toISOString();
         endIso = end.toISOString();
       }
    }

    let qShop = collection(db, 'orders');
    let qCustomer = collection(db, 'customerOrders');

    if (startIso && endIso) {
       qShop = query(collection(db, 'orders'), where('updatedAt', '>=', startIso), where('updatedAt', '<=', endIso));
       qCustomer = query(collection(db, 'customerOrders'), where('updatedAt', '>=', startIso), where('updatedAt', '<=', endIso));
    }

    setLoading(true);

    const unsubShop = onSnapshot(qShop, (snap) => {
       const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
       data.sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
       setShopOrders(data);
       setLoading(false);
    }, (err) => { 
       console.error("Error fetching shop orders:", err); 
       setLoading(false); 
    });

    const unsubCustomer = onSnapshot(qCustomer, (snap) => {
       const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
       data.sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
       setCustomerOrders(data);
    }, (err) => {
       console.error("Error fetching customer orders:", err);
    });

    return () => {
      unsubShop();
      unsubCustomer();
    }
  }, [dateFilter, customStart, customEnd]);

  const shopReceived = shopOrders.reduce((sum, o) => sum + (parseFloat(o.paymentReceived) || 0), 0);
  const shopPending = shopOrders.reduce((sum, o) => {
    const pending = (parseFloat(o.grandTotal) || 0) - (parseFloat(o.paymentReceived) || 0);
    return pending > 0 ? sum + pending : sum;
  }, 0);

  const customerReceived = customerOrders.reduce((sum, o) => sum + (parseFloat(o.paymentReceived) || 0), 0);
  const customerPending = customerOrders.reduce((sum, o) => {
    const pending = (parseFloat(o.grandTotal) || 0) - (parseFloat(o.paymentReceived) || 0);
    return pending > 0 ? sum + pending : sum;
  }, 0);

  return (
    <div className="payments-page" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>Payments Analytics</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Track all incoming and pending payments across Shops and Customers</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '180px' }}>
            <CustomDropdown
              options={dateOptions}
              value={dateFilter}
              onChange={(val) => setDateFilter(val)}
              placeholder="Filter Date"
            />
          </div>

          {dateFilter === 'Custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#fff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <input type="date" className="form-control" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ border: 'none', padding: '4px' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>to</span>
              <input type="date" className="form-control" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ border: 'none', padding: '4px' }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('shopOrders')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'shopOrders' ? '3px solid var(--primary-color)' : '3px solid transparent', color: activeTab === 'shopOrders' ? 'var(--primary-color)' : '#64748b', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px' }}
        >
          <Store size={18} /> Shop Orders (B2B)
        </button>
        <button 
          onClick={() => setActiveTab('customerOrders')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'customerOrders' ? '3px solid #8b5cf6' : '3px solid transparent', color: activeTab === 'customerOrders' ? '#8b5cf6' : '#64748b', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px' }}
        >
          <User size={18} /> Customer Orders (B2C)
        </button>
      </div>

      <div>
        
        {/* Shop Orders */}
        {activeTab === 'shopOrders' && (
          <div className="shop-orders-column">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
              <Store size={24} color="var(--primary-color)"/> Shop Orders Analytics
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
               <div className="card" style={{ padding: '20px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', boxShadow: 'none', borderRadius: '12px' }}>
                 <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Total Received</div>
                 <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d' }}>₹{shopReceived}</div>
               </div>
               <div className="card" style={{ padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', boxShadow: 'none', borderRadius: '12px' }}>
                 <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Total Pending</div>
                 <div style={{ fontSize: '28px', fontWeight: 700, color: '#7f1d1d' }}>₹{shopPending}</div>
               </div>
            </div>

            <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
                   <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>ORDER</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>SHOP</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>SUBTOTAL</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>DISCOUNT</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>CREDIT</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>GRAND TOTAL</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>RECEIVED</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>PENDING</th>
                         <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>STATUS</th>
                      </tr>
                   </thead>
                   <tbody>
                      {loading ? (
                         <tr><td colSpan="9" style={{textAlign: 'center', padding: '40px'}}><Loader2 className="spinner" size={24} color="var(--primary-color)" /></td></tr>
                      ) : shopOrders.length === 0 ? (
                         <tr><td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px'}}>No shop orders found for this period.</td></tr>
                      ) : shopOrders.map(order => {
                         const pending = Math.max(0, (parseFloat(order.grandTotal) || 0) - (parseFloat(order.paymentReceived) || 0));
                         return (
                           <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px' }}>
                                 <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>#{order.id.slice(-6).toUpperCase()}</div>
                                 <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(order.updatedAt || order.createdAt).toLocaleDateString()}</div>
                              </td>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{order.shopName}</td>
                              <td style={{ padding: '12px', fontWeight: 600 }}>₹{order.totalSubtotal || 0}</td>
                              <td style={{ padding: '12px', color: '#ef4444' }}>-₹{order.discount || 0}</td>
                              <td style={{ padding: '12px', color: '#8b5cf6' }}>-₹{order.creditsUsed || 0}</td>
                              <td style={{ padding: '12px', fontWeight: 700 }}>₹{order.grandTotal}</td>
                              <td style={{ padding: '12px', color: '#15803d', fontWeight: 600 }}>₹{order.paymentReceived || 0}</td>
                              <td style={{ padding: '12px', color: pending > 0 ? '#b91c1c' : '#10b981', fontWeight: pending > 0 ? 700 : 400 }}>₹{pending.toFixed(2)}</td>
                              <td style={{ padding: '12px' }}>
                                 <span className={`status-badge ${order.paymentStatus === 'Paid' ? 'status-success' : order.paymentStatus === 'Partial' ? 'status-warning' : 'status-danger'}`}>
                                   {order.paymentStatus || 'Unpaid'}
                                 </span>
                              </td>
                           </tr>
                         )
                      })}
                   </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Customer Orders */}
        {activeTab === 'customerOrders' && (
          <div className="customer-orders-column">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
              <User size={24} color="#8b5cf6"/> Customer Orders Analytics
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
               <div className="card" style={{ padding: '20px', backgroundColor: '#fae8ff', border: '1px solid #f5d0fe', boxShadow: 'none', borderRadius: '12px' }}>
                 <div style={{ fontSize: '13px', color: '#a21caf', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Total Received</div>
                 <div style={{ fontSize: '28px', fontWeight: 700, color: '#701a75' }}>₹{customerReceived}</div>
               </div>
               <div className="card" style={{ padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', boxShadow: 'none', borderRadius: '12px' }}>
                 <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Total Pending</div>
                 <div style={{ fontSize: '28px', fontWeight: 700, color: '#7f1d1d' }}>₹{customerPending}</div>
               </div>
            </div>

            <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
               <div className="table-responsive">
                 <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                   <thead>
                       <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>ORDER</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>CUSTOMER</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>SUBTOTAL</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>DISCOUNT</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>CREDIT</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>GRAND TOTAL</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>RECEIVED</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>PENDING</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>STATUS</th>
                       </tr>
                   </thead>
                   <tbody>
                      {loading ? (
                         <tr><td colSpan="9" style={{textAlign: 'center', padding: '40px'}}><Loader2 className="spinner" size={24} color="#8b5cf6" /></td></tr>
                      ) : customerOrders.length === 0 ? (
                         <tr><td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px'}}>No customer orders found for this period.</td></tr>
                      ) : customerOrders.map(order => {
                         const pending = Math.max(0, (parseFloat(order.grandTotal) || 0) - (parseFloat(order.paymentReceived) || 0));
                         return (
                           <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px' }}>
                                 <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>#{order.id.slice(-6).toUpperCase()}</div>
                                 <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(order.updatedAt || order.createdAt).toLocaleDateString()}</div>
                              </td>
                               <td style={{ padding: '12px', fontWeight: 600 }}>{order.customerName}</td>
                               <td style={{ padding: '12px', fontWeight: 600 }}>₹{order.totalSubtotal || 0}</td>
                               <td style={{ padding: '12px', color: '#ef4444' }}>-₹{order.discount || 0}</td>
                               <td style={{ padding: '12px', color: '#8b5cf6' }}>-₹{order.creditsUsed || 0}</td>
                               <td style={{ padding: '12px', fontWeight: 700 }}>₹{order.grandTotal}</td>
                               <td style={{ padding: '12px', color: '#15803d', fontWeight: 600 }}>₹{order.paymentReceived || 0}</td>
                               <td style={{ padding: '12px', color: pending > 0 ? '#b91c1c' : '#10b981', fontWeight: pending > 0 ? 700 : 400 }}>₹{pending.toFixed(2)}</td>
                              <td style={{ padding: '12px' }}>
                                 <span className={`status-badge ${order.paymentStatus === 'Paid' ? 'status-success' : order.paymentStatus === 'Partial' ? 'status-warning' : 'status-danger'}`}>
                                   {order.paymentStatus || 'Unpaid'}
                                 </span>
                              </td>
                           </tr>
                         )
                      })}
                   </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Payments;
