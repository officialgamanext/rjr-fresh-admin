import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Store, 
  Package, 
  CreditCard,
  ShoppingCart,
  RefreshCw,
  MapPin,
  IndianRupee,
  Loader2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from '../contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from '../components/CustomDropdown';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const dateOptions = [
  { value: 'All Time', label: 'All Time' },
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

const StatCard = ({ title, value, subtext, icon, trend, trendValue, iconBg, loading, colSpan }) => (
  <div className="card stat-card" style={{ gridColumn: colSpan ? `span ${colSpan}` : 'auto', display: 'flex', flexDirection: 'column', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-label" style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div className="stat-value" style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
          {loading ? <Loader2 size={24} className="spinner" /> : value}
        </div>
        {subtext && !loading && (
          <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 600, marginTop: '4px' }}>{subtext}</div>
        )}
      </div>
      <div className="stat-icon" style={{ backgroundColor: iconBg, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
    </div>
    
    {trend && (
      <div className={`stat-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`} style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
        {trend === 'up' ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />}
        <span style={{ color: trend === 'up' ? '#10b981' : '#ef4444' }}>{trendValue}%</span>
        <span style={{ color: '#94a3b8', marginLeft: '4px', fontWeight: 500 }}>vs last month</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedLocation } = useLocation();
  const [dateFilter, setDateFilter] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  const [rawData, setRawData] = useState({
    shops: [], customers: [], items: [], orders: [], customerOrders: [], returns: [], checkins: []
  });

  const [stats, setStats] = useState({
    shops: 0, customers: 0, items: 0,
    saleOrders: { count: 0, value: 0 },
    customerOrders: { count: 0, value: 0 },
    returns: { count: 0, value: 0 },
    visits: 0, payments: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const getCollectionData = async (collName) => {
      let q;
      if (selectedLocation === 'all') {
        q = query(collection(db, collName));
      } else {
        q = query(collection(db, collName), where('locationId', '==', selectedLocation));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };

    const fetchAllStats = async () => {
      try {
        const [
          shopsData, 
          customersData, 
          itemsData, 
          ordersData, 
          custOrdersData, 
          returnsData,
          visitsData
        ] = await Promise.all([
          getCollectionData('shops'),
          getCollectionData('customers'),
          getCollectionData('items'),
          getCollectionData('orders'),
          getCollectionData('customerOrders'),
          getCollectionData('returns'),
          getCollectionData('checkins')
        ]);
        
        const raw = {
          shops: shopsData,
          customers: customersData,
          items: itemsData,
          orders: ordersData,
          customerOrders: custOrdersData,
          returns: returnsData,
          checkins: visitsData
        };
        setRawData(raw);
        updateStats(raw, dateFilter, customStart, customEnd);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [selectedLocation]);

  const updateStats = (data, dFilter, cStart, cEnd) => {
    let startIso, endIso;
    if (dFilter === 'Custom') {
      if (cStart && cEnd) {
        startIso = new Date(cStart).toISOString();
        const endD = new Date(cEnd);
        endD.setHours(23, 59, 59, 999);
        endIso = endD.toISOString();
      }
    } else if (dFilter !== 'All Time') {
      const { start, end } = getDateRange(dFilter);
      if (start && end) {
        startIso = start.toISOString();
        endIso = end.toISOString();
      }
    }

    const filterByDate = (arr, dateField = 'createdAt') => {
      if (!startIso || !endIso) return arr;
      return arr.filter(item => {
        const itemDate = item[dateField] || item['timestamp'];
        if (!itemDate) return false;
        let isoStr = typeof itemDate === 'string' ? itemDate : (itemDate.toDate ? itemDate.toDate().toISOString() : null);
        if (!isoStr) return false;
        return isoStr >= startIso && isoStr <= endIso;
      });
    };

    const filteredOrders = filterByDate(data.orders);
    const filteredCustOrders = filterByDate(data.customerOrders);
    const filteredReturns = filterByDate(data.returns);
    const filteredVisits = filterByDate(data.checkins);

    // Shops, customers, items are all-time metrics typically, but you can filter if you prefer.
    // We will leave them as total active count.
    
    // Calculate Orders
    const saleCount = filteredOrders.length;
    const saleValue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
    
    const custCount = filteredCustOrders.length;
    const custValue = filteredCustOrders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
    
    const retCount = filteredReturns.length;
    const retValue = filteredReturns.reduce((sum, o) => sum + (parseFloat(o.totalRefund) || 0), 0);
    
    // Payments Received = sum of paymentReceived from orders + customerOrders
    const shopPayments = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.paymentReceived) || 0), 0);
    const custPayments = filteredCustOrders.reduce((sum, o) => sum + (parseFloat(o.paymentReceived) || 0), 0);
    
    setStats({
      shops: data.shops.length,
      customers: data.customers.length,
      items: data.items.length,
      saleOrders: { count: saleCount, value: saleValue },
      customerOrders: { count: custCount, value: custValue },
      returns: { count: retCount, value: retValue },
      visits: filteredVisits.length,
      payments: shopPayments + custPayments
    });
  };

  useEffect(() => {
    if (!loading) {
      updateStats(rawData, dateFilter, customStart, customEnd);
    }
  }, [dateFilter, customStart, customEnd]);

  // Fetch recent shop orders for the table
  useEffect(() => {
    setLoadingRecent(true);
    // Fetch latest 5 orders
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by location if not 'all'
      const filtered = selectedLocation === 'all' 
        ? orders 
        : orders.filter(o => o.locationId === selectedLocation);
        
      setRecentOrders(filtered.slice(0, 5));
      setLoadingRecent(false);
    }, (error) => {
      console.error("Error fetching recent orders:", error);
      setLoadingRecent(false);
    });
    
    return () => unsubscribe();
  }, [selectedLocation]);

  return (
    <div className="dashboard-page" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#0f172a', fontWeight: 800 }}>Business Overview</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>Monitor your orders, revenue, and customer activity</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {dateFilter === 'Custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="date" 
                className="form-control" 
                value={customStart} 
                onChange={e => setCustomStart(e.target.value)}
                style={{ padding: '8px 12px', height: '42px', borderRadius: '10px' }}
              />
              <span style={{ color: '#64748b' }}>to</span>
              <input 
                type="date" 
                className="form-control" 
                value={customEnd} 
                onChange={e => setCustomEnd(e.target.value)}
                style={{ padding: '8px 12px', height: '42px', borderRadius: '10px' }}
              />
            </div>
          )}
          <div style={{ width: '200px' }}>
            <CustomDropdown
              options={dateOptions}
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="Select Period"
              icon={<Filter size={16} />}
            />
          </div>
        </div>
      </div>

      {/* Top Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <StatCard 
          title="Total Revenue (B2B + B2C)" 
          value={`₹${(stats.saleOrders.value + stats.customerOrders.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
          subtext={`${stats.saleOrders.count + stats.customerOrders.count} Total Orders`}
          icon={<IndianRupee size={24} color="#3b71fe" />} 
          trend="up" 
          trendValue="18.2" 
          iconBg="#eff4ff"
          loading={loading}
        />
        <StatCard 
          title="Total Payments Received" 
          value={`₹${stats.payments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
          subtext="Across all platforms"
          icon={<CreditCard size={24} color="#10b981" />} 
          trend="up" 
          trendValue="12.5" 
          iconBg="#e6f9f1"
          loading={loading}
        />
        <StatCard 
          title="Total Returns Value" 
          value={`₹${stats.returns.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} 
          subtext={`${stats.returns.count} Return Orders`}
          icon={<RefreshCw size={24} color="#ef4444" />} 
          trend="down" 
          trendValue="4.1" 
          iconBg="#fef2f2"
          loading={loading}
        />
      </div>

      {/* Secondary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard 
          title="Sale Orders (B2B)" 
          value={stats.saleOrders.count} 
          subtext={`₹${stats.saleOrders.value.toLocaleString('en-IN')}`}
          icon={<ShoppingCart size={20} color="#8b5cf6" />} 
          iconBg="#f5f3ff"
          loading={loading}
        />
        <StatCard 
          title="Customer Orders" 
          value={stats.customerOrders.count} 
          subtext={`₹${stats.customerOrders.value.toLocaleString('en-IN')}`}
          icon={<ShoppingCart size={20} color="#f59e0b" />} 
          iconBg="#fffbeb"
          loading={loading}
        />
        <StatCard 
          title="Shop Visits" 
          value={stats.visits} 
          icon={<MapPin size={20} color="#0ea5e9" />} 
          iconBg="#e0f2fe"
          loading={loading}
        />
        <StatCard 
          title="Active Shops" 
          value={stats.shops} 
          icon={<Store size={20} color="#ec4899" />} 
          iconBg="#fce7f3"
          loading={loading}
        />
        <StatCard 
          title="B2C Customers" 
          value={stats.customers} 
          icon={<Users size={20} color="#14b8a6" />} 
          iconBg="#ccfbf1"
          loading={loading}
        />
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="card" style={{ border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} color="var(--primary-color)" /> Recent Shop Orders
            </h3>
            <button 
              onClick={() => navigate('/shop-orders')}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="table-responsive" style={{ padding: '0 12px 12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'left' }}>ORDER ID</th>
                  <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'left' }}>SHOP</th>
                  <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'left' }}>DATE</th>
                  <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>AMOUNT</th>
                  <th style={{ padding: '16px 12px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loadingRecent ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" size={24} color="var(--primary-color)" /></td></tr>
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No recent orders found.</td></tr>
                ) : (
                  recentOrders.map((order, index) => (
                    <tr key={order.id} style={{ borderBottom: index < recentOrders.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <td style={{ padding: '16px 12px', fontWeight: 600, color: '#0f172a' }}>#{order.id.slice(-6).toUpperCase()}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#3b71fe', cursor: 'pointer' }} onClick={() => navigate(`/shops/${order.shopId}`)}>{order.shopName}</div>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{parseFloat(order.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span className={`status-badge status-${(order.paymentStatus || 'pending').toLowerCase()}`} style={{ fontSize: '12px' }}>
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        .spinner {
          animation: rotate 1s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .stat-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
