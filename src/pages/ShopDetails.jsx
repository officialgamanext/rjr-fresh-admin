import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  Store,
  Clock,
  Navigation,
  ShoppingCart,
  CreditCard,
  Info,
  Plus,
  Search,
  X,
  Loader2,
  Wallet,
  History,
  Tag,
  IndianRupee,
  ChevronRight,
  Edit2,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';
import '../css/pages/shop-details.css';
import OrderModal from '../components/modals/OrderModal';
import PaymentModal from '../components/modals/PaymentModal';
import ReturnModal from '../components/modals/ReturnModal';

const ShopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [allPriceLists, setAllPriceLists] = useState([]);
  const [priceListItems, setPriceListItems] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [returns, setReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loadingCreditHistory, setLoadingCreditHistory] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    mobile: '',
    address: '',
    priceListId: ''
  });

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const listsSnap = await getDocs(collection(db, 'priceLists'));
        const lists = [];
        listsSnap.forEach(doc => lists.push({ id: doc.id, ...doc.data() }));
        setAllPriceLists(lists);
      } catch (error) {
        console.error("Error fetching price lists:", error);
      }
    };
    fetchLists();

    const shopRef = doc(db, 'shops', id);
    const unsubscribeShop = onSnapshot(shopRef, (shopSnap) => {
      if (shopSnap.exists()) {
        const data = shopSnap.data();
        setShop({ id: shopSnap.id, ...data });
        setFormData({
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          mobile: data.mobile,
          address: data.address,
          priceListId: data.priceListId || ''
        });
        setLoading(false);
      } else {
        toast.error("Shop not found");
        navigate('/shops');
      }
    }, (error) => {
      console.error("Error listening to shop:", error);
      setLoading(false);
    });

    return () => unsubscribeShop();
  }, [id, navigate]);

  useEffect(() => {
    if (activeTab === 'pricing' && shop?.priceListId) {
      setLoadingPrices(true);
      const q = query(collection(db, `priceLists/${shop.priceListId}/items`), orderBy('itemName', 'asc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
        setPriceListItems(items);
        setLoadingPrices(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, shop?.priceListId]);

  useEffect(() => {
    if (id) {
      setLoadingOrders(true);
      const q = query(
        collection(db, 'orders'), 
        where('shopId', '==', id)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort locally by createdAt desc
        ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(ordersData);
        setLoadingOrders(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoadingOrders(false);
        toast.error("Failed to load orders.");
      });
      return () => unsubscribe();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoadingVisits(true);
      const q = query(
        collection(db, 'checkins'), 
        where('shopId', '==', id)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const visitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort locally by timestamp desc if available
        visitsData.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
             return b.timestamp.toMillis() - a.timestamp.toMillis();
          }
          return 0;
        });
        setVisits(visitsData);
        setLoadingVisits(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoadingVisits(false);
        toast.error("Failed to load visits.");
      });
      return () => unsubscribe();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoadingPayments(true);
      const q = query(collection(db, 'payments'), where('shopId', '==', id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPayments(data);
        setLoadingPayments(false);
      }, (err) => {
        console.error(err);
        setLoadingPayments(false);
      });
      return () => unsubscribe();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoadingReturns(true);
      const q = query(collection(db, 'returns'), where('shopId', '==', id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReturns(data);
        setLoadingReturns(false);
      }, (err) => {
        console.error(err);
        setLoadingReturns(false);
      });
      return () => unsubscribe();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoadingCreditHistory(true);
      const q = query(collection(db, 'creditHistory'), where('shopId', '==', id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setCreditHistory(data);
        setLoadingCreditHistory(false);
      }, (err) => {
        console.error(err);
        setLoadingCreditHistory(false);
      });
      return () => unsubscribe();
    }
  }, [id]);

  useEffect(() => {
    // Fetch categories for the order modal
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      const deleteToast = toast.loading('Deleting order...');
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        toast.success('Order deleted successfully!', { id: deleteToast });
      } catch (error) {
        toast.error("Error deleting order.", { id: deleteToast });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading('Updating shop...');
    try {
      const shopRef = doc(db, 'shops', id);
      const updatedData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(shopRef, updatedData);
      setShop(prev => ({ ...prev, ...updatedData }));
      toast.success('Shop updated successfully!', { id: saveToast });
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error updating shop.", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="spinner" /></div>;
  if (!shop) return null;

  const assignedPriceList = allPriceLists.find(l => l.id === shop.priceListId);

  // Analytics Calculations
  const totalOrdersCount = orders.length;
  const returnOrdersCount = returns.length;
  const paymentReceivedTotal = orders.reduce((sum, order) => sum + (parseFloat(order.paymentReceived) || 0), 0);
  const paymentPendingTotal = orders.reduce((sum, order) => {
    const pending = (parseFloat(order.grandTotal) || 0) - (parseFloat(order.paymentReceived) || 0);
    return pending > 0 ? sum + pending : sum;
  }, 0);

  return (
    <div className="shop-details-page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate('/shops')} className="back-link">
            <ArrowLeft size={16} /> Back to Shops
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '28px' }}>
            <span className="shop-icon-container">
              <Store size={26} color="var(--primary-color)" />
            </span>
            {shop.name}
          </h1>
        </div>
      </div>

      <div className="analytics-top-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', boxShadow: 'none' }}>
          <span style={{ fontSize: '12px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 600 }}>Orders Count</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#0c4a6e' }}>{totalOrdersCount}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#ffedd5', border: '1px solid #fed7aa', boxShadow: 'none' }}>
          <span style={{ fontSize: '12px', color: '#c2410c', textTransform: 'uppercase', fontWeight: 600 }}>Return Orders</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#7c2d12' }}>{returnOrdersCount}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', boxShadow: 'none' }}>
          <span style={{ fontSize: '12px', color: '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>Payment Received</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#14532d' }}>₹{paymentReceivedTotal.toFixed(2)}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#fee2e2', border: '1px solid #fecaca', boxShadow: 'none' }}>
          <span style={{ fontSize: '12px', color: '#b91c1c', textTransform: 'uppercase', fontWeight: 600 }}>Payment Pending</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#7f1d1d' }}>₹{paymentPendingTotal.toFixed(2)}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', boxShadow: 'none' }}>
          <span style={{ fontSize: '12px', color: '#4338ca', textTransform: 'uppercase', fontWeight: 600 }}>Available Credits</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#312e81' }}>₹{shop.credits || 0}</span>
        </div>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#fae8ff', border: '1px solid #f5d0fe', boxShadow: 'none' }}>
          <span style={{ fontSize: '12px', color: '#a21caf', textTransform: 'uppercase', fontWeight: 600 }}>Shop Visits</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#701a75' }}>{visits.length}</span>
        </div>
      </div>

      <div className="tabs-wrapper">
        <div className="tabs-container">
          <button className={`tab-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}><Info size={18} /> Details</button>
          <button className={`tab-item ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}><IndianRupee size={18} /> Pricing</button>
          <button className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><ShoppingCart size={18} /> Orders</button>
          <button className={`tab-item ${activeTab === 'returns' ? 'active' : ''}`} onClick={() => setActiveTab('returns')}><RefreshCw size={18} /> Returns</button>
          <button className={`tab-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}><CreditCardIcon size={18} /> Payments</button>
          <button className={`tab-item ${activeTab === 'credits' ? 'active' : ''}`} onClick={() => setActiveTab('credits')}><Wallet size={18} /> Credits</button>
          <button className={`tab-item ${activeTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveTab('visits')}><History size={18} /> Visits</button>
        </div>
      </div>

      <div className="tab-content" style={{ marginTop: '24px' }}>
        {activeTab === 'details' && (
          <div className="details-grid">
            <div className="card main-info-card">
              <div className="card-top-header">
                <h3>Shop Information</h3>
                <button className="btn-primary edit-btn" onClick={() => setIsModalOpen(true)}>
                  <Edit2 size={16} /> Edit Shop
                </button>
              </div>

              <div className="info-sections">
                <div className="info-col">
                  <label className="section-label">Contact Details</label>
                  <div className="info-item">
                    <div className="info-icon phone-icon"><Phone size={18} /></div>
                    <div className="info-text">
                      <span className="info-label">Mobile Number</span>
                      <span className="info-value">{shop.mobile}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon map-icon"><MapPin size={18} /></div>
                    <div className="info-text">
                      <span className="info-label">Address</span>
                      <span className="info-value">{shop.address}</span>
                    </div>
                  </div>
                </div>

                <div className="info-col">
                  <label className="section-label">Pricing Configuration</label>
                  <div className="info-item">
                    <div className="info-icon price-icon"><Tag size={18} /></div>
                    <div className="info-text">
                      <span className="info-label">Active Price List</span>
                      <span className={`info-value ${assignedPriceList ? 'has-plist' : 'no-plist'}`}>
                        {assignedPriceList ? assignedPriceList.name : 'Not Assigned'}
                      </span>
                    </div>
                    {assignedPriceList && <ChevronRight size={16} className="item-link" onClick={() => navigate(`/pricelist/${assignedPriceList.id}`)} />}
                  </div>
                </div>
              </div>

              <div className="info-footer">
                <div className="footer-meta">
                  <div className="meta-item">
                    <Navigation size={14} />
                    <span>{shop.latitude}, {shop.longitude}</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>Created: {new Date(shop.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`status-pill pill-${shop.status.toLowerCase()}`}>
                  {shop.status}
                </div>
              </div>
            </div>

            <div className="stats-side-col">
              <div className="card stats-card">
                <h3>Business Stats</h3>
                <div className="stat-box">
                  <div className="stat-inner">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-number">0</span>
                  </div>
                  <div className="stat-inner">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-number">₹0</span>
                  </div>
                </div>
              </div>

              <div className="card action-summary-card">
                <h3>Quick Insights</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Assigning a price list allows you to manage specific rates for this shop in the Pricing tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3>{assignedPriceList ? assignedPriceList.name : 'None'}</h3>
              {assignedPriceList && <button className="btn-secondary" onClick={() => navigate(`/pricelist/${assignedPriceList.id}`)}>Manage List</button>}
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ITEM NAME</th>
                    <th>CATEGORY</th>
                    <th>UNIT</th>
                    <th>PRICE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {!shop.priceListId ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>No price list assigned. Please edit the shop details to select one.</td></tr>
                  ) : loadingPrices ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : priceListItems.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>This price list is currently empty.</td></tr>
                  ) : (
                    priceListItems.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                        <td><span className="status-badge" style={{ backgroundColor: '#f1f5f9' }}>{item.itemCategory}</span></td>
                        <td>{item.itemUnit}</td>
                        <td style={{ fontWeight: 700, fontSize: '16px' }}>₹{item.price}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3>Order History</h3>
              <button className="btn-primary" onClick={() => setIsOrderModalOpen(true)}>
                <Plus size={18} /> New Order
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>DATE</th>
                    <th>SUBTOTAL</th>
                    <th>DISCOUNT</th>
                    <th>GRAND TOTAL</th>
                    <th>PAID</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOrders ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px' }}>No orders found for this shop.</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>₹{order.totalSubtotal || 0}</td>
                        <td style={{ color: 'var(--danger)' }}>-₹{order.discount || 0}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>₹{order.grandTotal}</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{order.paymentReceived || 0}</td>
                        <td>
                          {(() => {
                            const paid = order.paymentReceived || 0;
                            const total = order.grandTotal;
                            if (paid === 0) return <span className="status-badge status-danger">Unpaid</span>;
                            if (paid < total) return <span className="status-badge status-warning">Partial</span>;
                            return <span className="status-badge status-success">Paid</span>;
                          })()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="action-btn-ui" onClick={() => { setEditingOrder(order); setIsViewOnly(true); setIsOrderModalOpen(true); }} title="View">
                              <Eye size={16} color="var(--primary-color)" />
                            </button>
                            <button className="action-btn-ui" onClick={() => setActiveTab('payments')} title="Manage Payments">
                              <CreditCardIcon size={16} color="var(--success)" />
                            </button>
                            <button className="action-btn-ui" onClick={() => { setEditingOrder(order); setIsViewOnly(false); setIsOrderModalOpen(true); }} title="Edit">
                              <Edit size={16} color="var(--warning)" />
                            </button>
                            <button className="action-btn-ui" onClick={() => handleDeleteOrder(order.id)} title="Delete">
                              <Trash2 size={16} color="var(--danger)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="card">
            <div className="card-header">
              <h3>Visit History</h3>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>DATE & TIME</th>
                    <th>EMPLOYEE NAME</th>
                    <th>MOBILE</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingVisits ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : visits.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '60px' }}>No visits found for this shop.</td></tr>
                  ) : (
                    visits.map(visit => (
                      <tr key={visit.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{visit.date || 'N/A'}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{visit.time || 'N/A'}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{visit.employeeName || visit.username || 'Unknown'}</td>
                        <td>{visit.employeeMobile || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3>Return Orders</h3>
              <button className="btn-primary" onClick={() => setIsReturnModalOpen(true)}>
                <RefreshCw size={18} /> Add Return
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>DATE</th>
                    <th>ITEMS RETURNED</th>
                    <th>REFUND VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingReturns ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : returns.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>No returns found.</td></tr>
                  ) : (
                    returns.map(ret => (
                      <tr key={ret.id}>
                        <td style={{ fontWeight: 600 }}>#{ret.orderId.slice(-6).toUpperCase()}</td>
                        <td>{new Date(ret.createdAt).toLocaleString()}</td>
                        <td>{ret.items?.length || 0} items</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>₹{ret.totalRefund}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3>Payments History</h3>
              <button className="btn-primary" onClick={() => setIsPaymentModalOpen(true)}>
                <Plus size={18} /> Add Payment
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                    <th>DISTRIBUTED</th>
                    <th>UNALLOCATED</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPayments ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : payments.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>No payments found.</td></tr>
                  ) : (
                    payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.createdAt).toLocaleString()}</td>
                        <td style={{ fontWeight: 600 }}>₹{payment.amount}</td>
                        <td style={{ color: 'var(--success)' }}>₹{payment.distributedAmount || 0}</td>
                        <td style={{ color: 'var(--warning)' }}>₹{payment.unallocatedAmount || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3>Credits History</h3>
              <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="var(--primary-color)" />
                <span style={{ fontWeight: 600 }}>Available Balance:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)' }}>₹{shop.credits || 0}</span>
              </div>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>TYPE</th>
                    <th>AMOUNT</th>
                    <th>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCreditHistory ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : creditHistory.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>No credit history found.</td></tr>
                  ) : (
                    creditHistory.map(history => (
                      <tr key={history.id}>
                        <td>{new Date(history.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${history.type === 'used' ? 'status-danger' : 'status-success'}`}>
                            {history.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: history.type === 'used' ? 'var(--danger)' : 'var(--success)' }}>
                          {history.type === 'used' ? '-' : '+'}₹{history.amount}
                        </td>
                        <td>{history.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal (Keeping existing modal code as it was functional) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Shop Details</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveShop}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Shop Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input type="text" name="mobile" className="form-control" value={formData.mobile} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Price List Assignment</label>
                    <select name="priceListId" className="form-control" value={formData.priceListId} onChange={handleInputChange}>
                      <option value="">Select a Price List</option>
                      {allPriceLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group"><label>Latitude</label><input type="text" name="latitude" className="form-control" value={formData.latitude} onChange={handleInputChange} required /></div>
                  <div className="form-group"><label>Longitude</label><input type="text" name="longitude" className="form-control" value={formData.longitude} onChange={handleInputChange} required /></div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea name="address" className="form-control" rows="2" value={formData.address} onChange={handleInputChange} required></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Modal */}
      <OrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
          setIsViewOnly(false);
        }}
        shop={shop}
        categories={categories}
        orderToEdit={editingOrder}
        isViewOnly={isViewOnly}
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        shop={shop}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        shop={shop}
      />
    </div>
  );
};

export default ShopDetails;
