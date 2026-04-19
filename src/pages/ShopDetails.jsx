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
  where
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
  Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';
import '../css/pages/shop-details.css';
import OrderModal from '../components/modals/OrderModal';

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
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    mobile: '',
    address: '',
    priceListId: ''
  });

  useEffect(() => {
    const fetchShopAndLists = async () => {
      try {
        const shopRef = doc(db, 'shops', id);
        const shopSnap = await getDoc(shopRef);

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
        } else {
          toast.error("Shop not found");
          navigate('/shops');
          return;
        }

        const listsSnap = await getDocs(collection(db, 'priceLists'));
        const lists = [];
        listsSnap.forEach(doc => lists.push({ id: doc.id, ...doc.data() }));
        setAllPriceLists(lists);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndLists();
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
    if (activeTab === 'orders') {
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
  }, [activeTab, id]);

  useEffect(() => {
    // Fetch categories for the order modal
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

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

      <div className="tabs-wrapper">
        <div className="tabs-container">
          <button className={`tab-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}><Info size={18} /> Details</button>
          <button className={`tab-item ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}><IndianRupee size={18} /> Pricing</button>
          <button className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><ShoppingCart size={18} /> Orders</button>
          <button className={`tab-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}><CreditCard size={18} /> Payments</button>
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
                    <th>ITEMS</th>
                    <th>GRAND TOTAL</th>
                    <th>PAYMENT</th>
                    <th>STATUS</th>
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
                        <td>{order.items?.length || 0} Items</td>
                        <td style={{ fontWeight: 700 }}>₹{order.grandTotal}</td>
                        <td>
                          <span className={`status-badge ${order.paymentReceived >= order.grandTotal ? 'status-success' : 'status-warning'}`}>
                            ₹{order.paymentReceived || 0}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge status-success">Completed</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other Tab Placeholders */}
        {['payments', 'credits', 'visits'].includes(activeTab) && (
          <div className="empty-tab-card">
            {activeTab === 'payments' && <CreditCard size={48} />}
            {activeTab === 'credits' && <Wallet size={48} />}
            {activeTab === 'visits' && <History size={48} />}
            <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Coming Soon</h3>
            <p>We are still working on this section. Check back soon!</p>
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
        onClose={() => setIsOrderModalOpen(false)}
        shop={shop}
        categories={categories}
      />
    </div>
  );
};

export default ShopDetails;
