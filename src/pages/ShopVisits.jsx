import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from '../contexts/LocationContext';
import { 
  MapPin, 
  Search, 
  Calendar, 
  Filter, 
  AlertTriangle, 
  Clock, 
  Plus, 
  X,
  Loader2,
  TrendingDown,
  User,
  Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import CustomDropdown from '../components/CustomDropdown';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';

const dateOptions = [
  { value: 'Today', label: 'Today' },
  { value: 'Yesterday', label: 'Yesterday' },
  { value: 'This Week', label: 'This Week' },
  { value: 'Last Week', label: 'Last Week' },
  { value: 'This Month', label: 'This Month' },
  { value: 'Last Month', label: 'Last Month' },
  { value: 'This Year', label: 'This Year' },
  { value: 'Last Year', label: 'Last Year' },
  { value: 'All Time', label: 'All Time' }
];

const ShopVisits = () => {
  const { selectedLocation, locations } = useLocation();
  const [activeTab, setActiveTab] = useState('list');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [visits, setVisits] = useState([]);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    shopId: '',
    employeeId: '',
    notes: ''
  });

  useEffect(() => {
    setLoading(true);
    let q;
    // Fetch all checkins and filter locally by location to be more robust
    // especially for historical data that might be missing locationId
    q = query(collection(db, 'checkins'));

    const unsubscribeVisits = onSnapshot(q, (snapshot) => {
      const visitData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort locally by timestamp desc to avoid needing a composite index
      visitData.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return dateB - dateA;
      });

      setVisits(visitData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching visits:", error);
      setLoading(false);
      if (error.code === 'failed-precondition') {
        toast.error("Firestore index required. Check console for link.");
      } else {
        toast.error("Failed to load visits.");
      }
    });

    // Listener for Shops
    let shopQ;
    if (selectedLocation === 'all') {
      shopQ = query(collection(db, 'shops'));
    } else {
      shopQ = query(collection(db, 'shops'), where('locationId', '==', selectedLocation));
    }
    const unsubscribeShops = onSnapshot(shopQ, (snapshot) => {
      setShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching shops:", error));

    // Fetch all orders and filter locally to be robust
    const orderQ = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(orderQ, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching orders:", error));

    // Listener for Employees (All employees regardless of location usually)
    const empQ = query(collection(db, 'employees'));
    const unsubscribeEmployees = onSnapshot(empQ, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching employees:", error));

    return () => {
      unsubscribeVisits();
      unsubscribeShops();
      unsubscribeOrders();
      unsubscribeEmployees();
    };
  }, [selectedLocation]);

  const getDateRange = (filter) => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'Today':
        return { start, end };
      case 'Yesterday':
        const yesterdayStart = new Date(start);
        yesterdayStart.setDate(start.getDate() - 1);
        const yesterdayEnd = new Date(end);
        yesterdayEnd.setDate(end.getDate() - 1);
        return { start: yesterdayStart, end: yesterdayEnd };
      case 'This Week':
        start.setDate(now.getDate() - now.getDay());
        return { start, end };
      case 'Last Week':
        const lastWeekStart = new Date(start);
        lastWeekStart.setDate(start.getDate() - start.getDay() - 7);
        const lastWeekEnd = new Date(end);
        lastWeekEnd.setDate(end.getDate() - end.getDay() - 1);
        return { start: lastWeekStart, end: lastWeekEnd };
      case 'This Month':
        start.setDate(1);
        return { start, end };
      case 'Last Month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'This Year':
        start.setMonth(0, 1);
        return { start, end };
      case 'Last Year':
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { start: lastYearStart, end: lastYearEnd };
      default:
        return null;
    }
  };

  const filteredVisits = useMemo(() => {
    let result = visits;

    // Filter by location if not 'all'
    if (selectedLocation !== 'all') {
      const validShopIds = new Set(shops.map(s => s.id));
      result = result.filter(v => validShopIds.has(v.shopId));
    }

    const range = getDateRange(dateFilter);
    if (range) {
      result = result.filter(v => {
        if (!v.timestamp) return false;
        const vDate = v.timestamp.toDate ? v.timestamp.toDate() : new Date(v.timestamp);
        return vDate >= range.start && vDate <= range.end;
      });
    }
    if (searchTerm) {
      result = result.filter(v => 
        (v.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [visits, dateFilter, searchTerm]);

  const analyticsData = useMemo(() => {
    const shopVisitCounts = shops.map(shop => {
      const count = visits.filter(v => v.shopId === shop.id).length;
      const shopVisits = visits.filter(v => v.shopId === shop.id);
      const lastVisit = shopVisits.length > 0 ? shopVisits[0] : null;
      let daysSinceLastVisit = Infinity;
      if (lastVisit && lastVisit.timestamp) {
        const lastVisitDate = lastVisit.timestamp.toDate ? lastVisit.timestamp.toDate() : new Date(lastVisit.timestamp);
        daysSinceLastVisit = Math.floor((new Date() - lastVisitDate) / (1000 * 60 * 60 * 24));
      }
      return { ...shop, visitCount: count, daysSinceLastVisit };
    });

    const lowestVisits = [...shopVisitCounts].sort((a, b) => a.visitCount - b.visitCount);
    const shopsAtRisk = shopVisitCounts.filter(s => s.daysSinceLastVisit >= 7).sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

    return { lowestVisits, shopsAtRisk };
  }, [shops, visits]);

  const orderRiskShops = useMemo(() => {
    return shops.map(shop => {
      const shopOrders = orders.filter(o => o.shopId === shop.id);
      const lastOrder = shopOrders.length > 0 ? shopOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
      const daysSinceLastOrder = lastOrder ? Math.floor((new Date() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24)) : Infinity;
      return { ...shop, lastOrder, daysSinceLastOrder };
    }).filter(s => s.daysSinceLastOrder >= 3).sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);
  }, [shops, orders]);

  const handleOpenModal = () => {
    setFormData({
      shopId: '',
      employeeId: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveVisit = async (e) => {
    e.preventDefault();
    if (!formData.shopId || !formData.employeeId) {
      toast.error("Please select shop and employee");
      return;
    }

    setSaving(true);
    try {
      const shop = shops.find(s => s.id === formData.shopId);
      const employee = employees.find(e => e.id === formData.employeeId);

      if (!shop || !employee) {
        toast.error("Shop or Employee data not found");
        setSaving(false);
        return;
      }

      const visitData = {
        shopId: formData.shopId,
        shopName: shop.name || 'Unknown Shop',
        employeeId: formData.employeeId,
        employeeName: employee.name || 'Unknown Employee',
        employeeMobile: employee.mobile || '',
        notes: formData.notes,
        locationId: shop.locationId || selectedLocation,
        timestamp: serverTimestamp(),
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      };

      await addDoc(collection(db, 'checkins'), visitData);
      toast.success("Visit added successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding visit:", error);
      toast.error("Failed to add visit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="flex items-center gap-2">
            <MapPin color="var(--primary-color)" /> Shop Visits
          </h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Shop Visits</span>
          </div>
        </div>
        <button className="btn-primary" onClick={handleOpenModal}>
          <Plus size={20} /> Add Shop Visit
        </button>
      </div>

      <div className="tabs-container" style={{ marginBottom: '24px' }}>
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <Clock size={18} /> List
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingDown size={18} /> Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orderRisk' ? 'active' : ''}`}
          onClick={() => setActiveTab('orderRisk')}
        >
          <AlertTriangle size={18} /> Shop Orders Risk
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input 
                type="text" 
                placeholder="Search shop or employee..." 
                className="form-control"
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            <div style={{ width: '200px' }}>
              <CustomDropdown 
                options={dateOptions}
                value={dateFilter}
                onChange={setDateFilter}
                placeholder="Date Filter"
                icon={<Calendar size={16} />}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>SHOP NAME</th>
                  <th>VISITED BY</th>
                  <th>DATE & TIME</th>
                  <th>NOTES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                ) : filteredVisits.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No visits found.</td></tr>
                ) : (
                  filteredVisits.map((visit) => (
                    <tr key={visit.id}>
                      <td>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 600 }}>{visit.shopName}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {visit.shopId}</span>
                        </div>
                      </td>
                      <td>
                        <div className="avatar-info">
                          <div className="avatar" style={{ backgroundColor: '#f1f5f9' }}>
                            <User size={18} color="var(--primary-color)" />
                          </div>
                          <div>
                            <span className="info-name">{visit.employeeName}</span>
                            <span className="info-sub">{visit.employeeMobile}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 500 }}>{visit.date}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{visit.time}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {visit.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="flex items-center gap-2">
                <TrendingDown size={18} color="#ef4444" /> Lowest Visits Shops
              </h3>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>SHOP NAME</th>
                    <th>TOTAL VISITS</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.lowestVisits.slice(0, 10).map(shop => (
                    <tr key={shop.id}>
                      <td style={{ fontWeight: 600 }}>{shop.name}</td>
                      <td>
                        <span className={`status-badge ${shop.visitCount === 0 ? 'status-failed' : 'status-pending'}`}>
                          {shop.visitCount} visits
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="flex items-center gap-2">
                <AlertTriangle size={18} color="#f59e0b" /> Shops at Risk (No visit {'>'} 7 days)
              </h3>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>SHOP NAME</th>
                    <th>LAST VISIT</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.shopsAtRisk.length === 0 ? (
                    <tr><td colSpan="2" style={{ textAlign: 'center', padding: '40px' }}>No shops at risk.</td></tr>
                  ) : (
                    analyticsData.shopsAtRisk.map(shop => (
                      <tr key={shop.id}>
                        <td style={{ fontWeight: 600 }}>{shop.name}</td>
                        <td>
                          <span className="status-badge status-failed">
                            {shop.daysSinceLastVisit === Infinity ? 'Never Visited' : `${shop.daysSinceLastVisit} days ago`}
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
      )}

      {activeTab === 'orderRisk' && (
        <div className="card">
          <div className="card-header">
            <h3 className="flex items-center gap-2">
              <AlertTriangle size={18} color="#ef4444" /> Shop Orders Risk (No order {'>'} 3 days)
            </h3>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>SHOP NAME</th>
                  <th>LAST ORDER</th>
                  <th>RISK STATUS</th>
                </tr>
              </thead>
              <tbody>
                {orderRiskShops.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>No shops at order risk.</td></tr>
                ) : (
                  orderRiskShops.map(shop => (
                    <tr key={shop.id}>
                      <td style={{ fontWeight: 600 }}>{shop.name}</td>
                      <td>
                        <div className="flex flex-col">
                          <span>{shop.lastOrder ? new Date(shop.lastOrder.createdAt).toLocaleDateString() : 'No Orders'}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {shop.daysSinceLastOrder === Infinity ? 'N/A' : `${shop.daysSinceLastOrder} days ago`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge status-failed">
                          {shop.daysSinceLastOrder > 5 ? 'High Risk' : 'Medium Risk'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="header-icon-title">
                <div className="header-icon-box">
                  <MapPin size={20} color="var(--primary-color)" />
                </div>
                <h2>Add Shop Visit</h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveVisit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Shop</label>
                  <CustomDropdown 
                    options={shops.map(s => ({ value: s.id, label: s.name }))}
                    value={formData.shopId}
                    onChange={(val) => setFormData(prev => ({ ...prev, shopId: val }))}
                    placeholder="Select Shop"
                    searchable={true}
                    icon={<Store size={18} />}
                  />
                </div>
                <div className="form-group">
                  <label>Visited By (Employee)</label>
                  <CustomDropdown 
                    options={employees.map(e => ({ value: e.id, label: e.name }))}
                    value={formData.employeeId}
                    onChange={(val) => setFormData(prev => ({ ...prev, employeeId: val }))}
                    placeholder="Select Employee"
                    searchable={true}
                    icon={<User size={18} />}
                  />
                </div>
                <div className="form-group">
                  <label>Visit Notes (Optional)</label>
                  <textarea 
                    className="form-control premium-input"
                    placeholder="Enter visit details..."
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-premium" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary-premium" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : 'Save Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tabs-container {
          display: flex;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 1px;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--primary-color);
        }
        .tab-btn.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
          background-color: #f8fafc;
        }
        .avatar-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .info-name {
          display: block;
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
        }
        .info-sub {
          display: block;
          font-size: 12px;
          color: #64748b;
        }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .gap-2 { gap: 8px; }
      `}</style>
    </div>
  );
};

export default ShopVisits;
