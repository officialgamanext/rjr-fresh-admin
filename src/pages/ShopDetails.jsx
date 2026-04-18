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
  orderBy 
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
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';

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

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    mobile: '',
    address: '',
    priceListId: ''
  });

  // Fetch shop details and fetch all price lists for the dropdown
  useEffect(() => {
    const fetchShopAndLists = async () => {
      try {
        // Shop Details
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

        // All Price Lists
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

  // Fetch prices if a price list is assigned and Prices tab is active
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
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={28} color="var(--primary-color)" /> {shop.name}
          </h1>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}><Info size={18} /> Details</button>
        <button className={`tab-item ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}><DollarSign size={18} /> Pricing</button>
        <button className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><ShoppingCart size={18} /> Orders</button>
        <button className={`tab-item ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}><CreditCard size={18} /> Payments</button>
        <button className={`tab-item ${activeTab === 'credits' ? 'active' : ''}`} onClick={() => setActiveTab('credits')}><Wallet size={18} /> Credits</button>
        <button className={`tab-item ${activeTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveTab('visits')}><History size={18} /> Visits</button>
      </div>

      <div className="tab-content">
        {activeTab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', margin: 0 }}>Shop Information</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Edit Shop</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div>
                  <label className="detail-label">Contact Details</label>
                  <div className="detail-item-list">
                    <div className="detail-item">
                      <div className="detail-icon" style={{ backgroundColor: 'var(--primary-light)' }}><Phone size={18} color="var(--primary-color)" /></div>
                      <div><span className="detail-sub">Mobile</span><span className="detail-val">{shop.mobile}</span></div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-icon" style={{ backgroundColor: 'var(--primary-light)' }}><MapPin size={18} color="var(--primary-color)" /></div>
                      <div><span className="detail-sub">Address</span><span className="detail-val">{shop.address}</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="detail-label">Pricing Config</label>
                  <div className="detail-item">
                    <div className="detail-icon" style={{ backgroundColor: '#fff7ed' }}><DollarSign size={18} color="#f59e0b" /></div>
                    <div>
                      <span className="detail-sub">Assigned Price List</span>
                      <span className="detail-val" style={{ color: assignedPriceList ? 'var(--text-primary)' : 'var(--danger)' }}>
                        {assignedPriceList ? assignedPriceList.name : 'Not Assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="divider" />
              <label className="detail-label">Location & Logs</label>
              <div style={{ display: 'flex', gap: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} color="var(--text-muted)" /> {shop.latitude}, {shop.longitude}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} color="var(--text-muted)" /> {new Date(shop.createdAt).toLocaleDateString()}</div>
                <div><span className={`status-badge status-${shop.status === 'Active' ? 'success' : 'danger'}`}>{shop.status}</span></div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Business Stats</h3>
              <div className="stat-overview-list">
                <div className="stat-overview-item"><span className="stat-over-label">Orders</span><span className="stat-over-val">0</span></div>
                <div className="stat-overview-item"><span className="stat-over-label">Revenue</span><span className="stat-over-val">₹0</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3>Price List: {assignedPriceList ? assignedPriceList.name : 'None'}</h3>
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
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No price list assigned. Edit shop details to assign one.</td></tr>
                  ) : loadingPrices ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : priceListItems.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>This price list is empty.</td></tr>
                  ) : (
                    priceListItems.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                        <td>{item.itemCategory}</td>
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

        {activeTab === 'orders' && <div className="card" style={{ padding: '60px', textAlign: 'center' }}><ShoppingCart size={40} style={{ opacity: 0.2, margin: '0 auto 10px' }} /><p>No orders yet.</p></div>}
        {activeTab === 'payments' && <div className="card" style={{ padding: '60px', textAlign: 'center' }}><CreditCard size={40} style={{ opacity: 0.2, margin: '0 auto 10px' }} /><p>No payments yet.</p></div>}
        {activeTab === 'credits' && <div className="card" style={{ padding: '60px', textAlign: 'center' }}><Wallet size={40} style={{ opacity: 0.2, margin: '0 auto 10px' }} /><p>No credits yet.</p></div>}
        {activeTab === 'visits' && <div className="card" style={{ padding: '60px', textAlign: 'center' }}><History size={40} style={{ opacity: 0.2, margin: '0 auto 10px' }} /><p>No visits yet.</p></div>}
      </div>

      {/* Edit Modal */}
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

      <style>{`
        .back-link { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 14px; margin-bottom: 12px; background: none; border: none; cursor: pointer; padding: 0; }
        .tabs-container { display: flex; gap: 24px; border-bottom: 2px solid var(--border-color); margin-bottom: 24px; overflow-x: auto; }
        .tab-item { display: flex; align-items: center; gap: 8px; padding: 12px 8px; font-size: 14px; font-weight: 600; color: var(--text-muted); background: none; border: none; cursor: pointer; position: relative; white-space: nowrap; }
        .tab-item.active { color: var(--primary-color); }
        .tab-item.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background-color: var(--primary-color); }
        .detail-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 12px; }
        .detail-item { display: flex; alignItems: center; gap: 12px; margin-bottom: 16px; }
        .detail-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; alignItems: center; justifyContent: center; }
        .detail-sub { font-size: 12px; color: var(--text-muted); display: block; }
        .detail-val { font-weight: 600; font-size: 14px; }
        .divider { margin: 24px 0; border: none; border-top: 1px solid var(--border-color); }
        .stat-overview-item { padding: 16px; border-radius: 12px; background-color: var(--bg-main); margin-bottom: 12px; }
        .stat-over-label { font-size: 12px; color: var(--text-muted); display: block; }
        .stat-over-val { font-size: 22px; font-weight: 800; }
        .spinner { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ShopDetails;
