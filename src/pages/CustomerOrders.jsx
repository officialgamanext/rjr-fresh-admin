import React, { useState, useEffect } from 'react';
import { Search, Loader2, User, Edit2 } from 'lucide-react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
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

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [dateFilter, setDateFilter] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    switch(filter) {
      case 'Today': return { start: today, end: endOfToday };
      case 'Yesterday': {
        const start = new Date(today); start.setDate(today.getDate() - 1);
        const end = new Date(endOfToday); end.setDate(endOfToday.getDate() - 1);
        return { start, end };
      }
      case 'This Week': {
        const start = new Date(today); start.setDate(today.getDate() - today.getDay()); 
        return { start, end: endOfToday };
      }
      case 'Last Week': {
        const start = new Date(today); start.setDate(today.getDate() - today.getDay() - 7);
        const end = new Date(endOfToday); end.setDate(today.getDate() - today.getDay() - 1);
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
      default: return { start: null, end: null };
    }
  };

  useEffect(() => {
    let startIso, endIso;
    if (dateFilter === 'Custom') {
       if (customStart && customEnd) {
         startIso = new Date(customStart).toISOString();
         const endD = new Date(customEnd); endD.setHours(23, 59, 59, 999);
         endIso = endD.toISOString();
       }
    } else {
       const { start, end } = getDateRange(dateFilter);
       if (start && end) {
         startIso = start.toISOString();
         endIso = end.toISOString();
       }
    }

    let q = query(collection(db, 'customerOrders'));
    if (startIso && endIso) {
       q = query(collection(db, 'customerOrders'), where('createdAt', '>=', startIso), where('createdAt', '<=', endIso));
    }

    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customer orders:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [dateFilter, customStart, customEnd]);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <User color="#8b5cf6" /> Customer Orders
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage all B2C orders</p>
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

      <div className="analytics-top-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#4338ca', fontWeight: 600, textTransform: 'uppercase' }}>Total Orders</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#312e81' }}>{totalOrders}</div>
        </div>
        <div className="card" style={{ padding: '20px', backgroundColor: '#fae8ff', border: '1px solid #f5d0fe', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#a21caf', fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#701a75' }}>₹{(totalRevenue || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: '20px', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>Payment Received</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#14532d' }}>₹{(totalReceived || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: '20px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', boxShadow: 'none' }}>
          <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600, textTransform: 'uppercase' }}>Payment Pending</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#7f1d1d' }}>₹{(totalPending || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Search orders by ID, Customer or Status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>ORDER ID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>CUSTOMER</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>DATE</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>SUBTOTAL</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>DISCOUNT</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>CREDIT</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>GRAND TOTAL</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>PAID</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>BALANCE</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{textAlign: 'center', padding: '40px'}}><Loader2 className="spinner" size={24} color="#8b5cf6" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="11" style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No orders found.</td></tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{order.customerName}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>₹{(order.totalSubtotal || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', color: '#ef4444' }}>-₹{(order.discount || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', color: '#8b5cf6' }}>-₹{(order.creditsUsed || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#8b5cf6' }}>₹{(order.grandTotal || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#10b981' }}>₹{(order.paymentReceived || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: ((order.balance ?? (order.grandTotal - (order.paymentReceived || 0))) || 0) > 0 ? '#ef4444' : '#10b981' }}>
                    ₹{((order.balance ?? (order.grandTotal - (order.paymentReceived || 0))) || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`status-badge status-${order.status === 'Delivered' ? 'success' : order.status === 'Cancelled' ? 'danger' : 'warning'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => navigate(`/customers/${order.customerId}`)}
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

export default CustomerOrders;
