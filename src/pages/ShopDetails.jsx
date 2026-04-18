import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  History
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const ShopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    mobile: '',
    address: ''
  });

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const docRef = doc(db, 'shops', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setShop({ id: docSnap.id, ...data });
          setFormData({
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            mobile: data.mobile,
            address: data.address
          });
        } else {
          toast.error("Shop not found");
          navigate('/shops');
        }
      } catch (error) {
        console.error("Error fetching shop details:", error);
        toast.error("Error loading shop details");
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [id, navigate]);
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
      console.error("Error saving shop: ", error);
      toast.error("Error updating shop details.", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 10px' }}></div>
        Loading shop details...
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="shop-details-page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <button
            onClick={() => navigate('/shops')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={16} /> Back to Shops
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Store size={28} color="var(--primary-color)" /> {shop.name}
          </h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-item ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Info size={18} /> Details
        </button>
        <button
          className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingCart size={18} /> Orders
        </button>
        <button
          className={`tab-item ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={18} /> Payments
        </button>
        <button
          className={`tab-item ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => setActiveTab('credits')}
        >
          <Wallet size={18} /> Credits
        </button>
        <button
          className={`tab-item ${activeTab === 'visits' ? 'active' : ''}`}
          onClick={() => setActiveTab('visits')}
        >
          <History size={18} /> Visits
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', margin: 0 }}>Shop Information</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-primary" 
                    style={{ height: '34px', padding: '0 12px', fontSize: '13px' }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Edit Shop
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div>
                  <label className="detail-label">Contact Details</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="detail-item">
                      <div className="detail-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
                        <Phone size={18} color="var(--primary-color)" />
                      </div>
                      <div>
                        <span className="detail-sub">Mobile Number</span>
                        <span className="detail-val">{shop.mobile}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon" style={{ backgroundColor: 'var(--primary-light)' }}>
                        <MapPin size={18} color="var(--primary-color)" />
                      </div>
                      <div>
                        <span className="detail-sub">Address</span>
                        <span className="detail-val">{shop.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="detail-label">Location & Coordinates</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="detail-item">
                      <div className="detail-icon" style={{ backgroundColor: '#e6f9f1' }}>
                        <MapPin size={18} color="#10b981" />
                      </div>
                      <div>
                        <span className="detail-sub">Latitude</span>
                        <span className="detail-val">{shop.latitude}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon" style={{ backgroundColor: '#e6f9f1' }}>
                        <MapPin size={18} color="#10b981" />
                      </div>
                      <div>
                        <span className="detail-sub">Longitude</span>
                        <span className="detail-val">{shop.longitude}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="divider" />

              <div>
                <label className="detail-label">System Logs</label>
                <div style={{ display: 'flex', gap: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '14px' }}>Created: <span style={{ fontWeight: 600 }}>{new Date(shop.createdAt).toLocaleDateString()}</span></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '14px' }}>Status: <span className={`status-badge status-${shop.status === 'Active' ? 'success' : 'danger'}`} style={{ marginLeft: '4px' }}>{shop.status}</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Stats Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="stat-overview-item">
                  <span className="stat-over-label">Total Orders</span>
                  <span className="stat-over-val">0</span>
                </div>
                <div className="stat-overview-item">
                  <span className="stat-over-label">Total Revenue</span>
                  <span className="stat-over-val">$0.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <h3>Shop Orders</h3>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    className="form-control"
                    style={{ paddingLeft: '36px', width: '250px', height: '36px' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <button className="btn-primary" style={{ height: '36px', padding: '0 16px' }}>
                <Plus size={18} /> Add Order
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>DATE</th>
                    <th>ITEMS</th>
                    <th>TOTAL AMOUNT</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                      <ShoppingCart size={40} style={{ marginBottom: '12px', opacity: 0.2 }} />
                      <p>No orders found for this shop.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CreditCard size={48} style={{ marginBottom: '16px', opacity: 0.2, margin: '0 auto' }} />
            <h3>Payment History</h3>
            <p>Payment tracking will be available soon.</p>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Wallet size={48} style={{ marginBottom: '16px', opacity: 0.2, margin: '0 auto' }} />
            <h3>Credit Management</h3>
            <p>Credit and balance details will be visible here.</p>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <History size={48} style={{ marginBottom: '16px', opacity: 0.2, margin: '0 auto' }} />
            <h3>Visit History</h3>
            <p>Log of all shop visits will be listed here.</p>
          </div>
        )}
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
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Latitude</label>
                    <input 
                      type="text" 
                      name="latitude" 
                      className="form-control" 
                      value={formData.latitude}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude</label>
                    <input 
                      type="text" 
                      name="longitude" 
                      className="form-control" 
                      value={formData.longitude}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input 
                    type="text" 
                    name="mobile" 
                    className="form-control" 
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea 
                    name="address" 
                    className="form-control" 
                    rows="3" 
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tabs-container {
          display: flex;
          gap: 24px;
          border-bottom: 2px solid var(--border-color);
          margin-bottom: 24px;
        }
        .tab-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 8px;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          transition: var(--transition);
        }
        .tab-item:hover {
          color: var(--primary-color);
        }
        .tab-item.active {
          color: var(--primary-color);
        }
        .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--primary-color);
        }
        .detail-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          display: block;
          margin-bottom: 16px;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .detail-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .detail-sub {
          font-size: 13px;
          color: var(--text-muted);
          display: block;
        }
        .detail-val {
          font-weight: 600;
        }
        .divider {
          margin: 30px 0;
          border: none;
          border-top: 1px solid var(--border-color);
        }
        .stat-overview-item {
          padding: 16px;
          border-radius: 12px;
          background-color: var(--bg-main);
        }
        .stat-over-label {
          font-size: 13px;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }
        .stat-over-val {
          font-size: 24px;
          font-weight: 800;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ShopDetails;
