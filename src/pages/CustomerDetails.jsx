import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Info, 
  ShoppingCart, 
  Edit2, 
  X, 
  Loader2, 
  Plus,
  Clock,
  Calendar,
  Eye,
  Trash2,
  Award,
  CheckCircle,
  Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';
import '../css/pages/customer-details.css';
import OrderModal from '../components/modals/OrderModal';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    loyaltyPoints: 0
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const docRef = doc(db, 'customers', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomer({ id: docSnap.id, ...data });
          setFormData({
            name: data.name,
            mobile: data.mobile,
            email: data.email || '',
            address: data.address,
            loyaltyPoints: data.loyaltyPoints || 0
          });
        } else {
          toast.error("Customer not found");
          navigate('/customers');
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, navigate]);

  useEffect(() => {
    if (activeTab === 'orders') {
      setLoadingOrders(true);
      const q = query(
        collection(db, 'orders'), 
        where('customerId', '==', id)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(ordersData);
        setLoadingOrders(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoadingOrders(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, id]);

  useEffect(() => {
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

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updateToast = toast.loading('Updating customer...');
    
    try {
      const docRef = doc(db, 'customers', id);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setCustomer(prev => ({ ...prev, ...formData }));
      toast.success('Customer updated!', { id: updateToast });
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Error updating customer', { id: updateToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        toast.success('Order deleted');
      } catch (error) {
        toast.error("Error deleting order");
      }
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="spinner" /></div>;
  if (!customer) return null;

  return (
    <div className="customer-details-page">
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/customers')} className="back-link">
            <ArrowLeft size={16} /> Back to Customers
          </button>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <div className="customer-avatar-header">
              <User size={24} color="var(--primary-color)" />
            </div>
            {customer.name}
          </h1>
        </div>
      </div>

      <div className="tabs-wrapper">
        <div className="tabs-container">
          <button className={`tab-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}><Info size={18} /> Details</button>
          <button className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><ShoppingCart size={18} /> Orders</button>
          <button className={`tab-item ${activeTab === 'loyalty' ? 'active' : ''}`} onClick={() => setActiveTab('loyalty')}><Award size={18} /> Loyalty Points</button>
        </div>
      </div>

      <div className="tab-content" style={{ marginTop: '24px' }}>
        {activeTab === 'details' && (
          <div className="details-card-layout">
            <div className="card customer-info-card">
              <div className="card-top-header">
                <h3>Customer Information</h3>
                <button className="btn-primary edit-btn" onClick={() => setIsModalOpen(true)}>
                  <Edit2 size={16} /> Edit Profile
                </button>
              </div>

              <div className="info-grid">
                <div className="info-section">
                  <label className="section-label">Contact Information</label>
                  <div className="info-row">
                    <div className="info-icon-box phone"><Phone size={18} /></div>
                    <div className="info-data">
                      <span className="label">Mobile</span>
                      <span className="value">{customer.mobile}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-icon-box mail"><Mail size={18} /></div>
                    <div className="info-data">
                      <span className="label">Email</span>
                      <span className="value">{customer.email || 'Not Provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <label className="section-label">Address Detail</label>
                  <div className="info-row">
                    <div className="info-icon-box map"><MapPin size={18} /></div>
                    <div className="info-data">
                      <span className="label">Full Address</span>
                      <span className="value">{customer.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-footer">
                <div className="meta-info">
                  <div className="meta-pill"><Calendar size={14} /> Joined: {new Date(customer.createdAt).toLocaleDateString()}</div>
                  <div className="meta-pill"><Clock size={14} /> Last Update: {customer.updatedAt ? new Date(customer.updatedAt).toLocaleTimeString() : 'N/A'}</div>
                </div>
                <div className="customer-id-badge">ID: {customer.id}</div>
              </div>
            </div>

            <div className="quick-stats-sidebar">
              <div className="card stat-summary-card">
                <h3>Quick Stats</h3>
                <div className="stat-item">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">{orders.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Loyalty Points</span>
                  <span className="stat-value" style={{ color: 'var(--warning-color)', fontWeight: 'bold' }}>{customer.loyaltyPoints || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Account Status</span>
                  <span className="status-badge status-success">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3>Orders History</h3>
              <button className="btn-primary" onClick={() => { setIsOrderModalOpen(true); setEditingOrder(null); setIsViewOnly(false); }}>
                <Plus size={18} /> New Order
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>DATE</th>
                    <th>GRAND TOTAL</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOrders ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No orders found for this customer.</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 600 }}>#{order.id.slice(-6).toUpperCase()}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>₹{order.grandTotal}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`status-badge ${order.status === 'Delivered' ? 'status-success' : 'status-warning'}`}>
                              {order.status === 'Shipped' && <Truck size={12} style={{ marginRight: '4px' }} />}
                              {order.status === 'Delivered' && <CheckCircle size={12} style={{ marginRight: '4px' }} />}
                              {order.status}
                            </span>
                            {order.status === 'Shipped' && (
                              <button 
                                className="btn-success-sm" 
                                onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                title="Mark as Delivered"
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: 'none', background: 'var(--success-color)', color: 'white', cursor: 'pointer' }}
                              >
                                Delivered
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="action-btn-ui" onClick={() => { setEditingOrder(order); setIsViewOnly(true); setIsOrderModalOpen(true); }}>
                              <Eye size={16} color="var(--primary-color)" />
                            </button>
                            <button className="action-btn-ui" onClick={() => { setEditingOrder(order); setIsViewOnly(false); setIsOrderModalOpen(true); }}>
                              <Edit2 size={16} color="var(--warning-color)" />
                            </button>
                            <button className="action-btn-ui" onClick={() => handleDeleteOrder(order.id)}>
                              <Trash2 size={16} color="var(--danger-color)" />
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

        {activeTab === 'loyalty' && (
          <div className="card loyalty-card">
            <div className="card-header">
              <h3>Loyalty Program</h3>
            </div>
            <div className="loyalty-content" style={{ padding: '24px', textAlign: 'center' }}>
              <div className="loyalty-points-display" style={{ marginBottom: '24px' }}>
                <div className="points-circle" style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#fdf4ff', border: '4px solid #f5d0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', flexDirection: 'column' }}>
                  <Award size={40} color="#a21caf" />
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#701a75' }}>{customer.loyaltyPoints || 0}</span>
                </div>
                <h4>Available Points</h4>
                <p style={{ color: 'var(--text-muted)' }}>Customer can redeem these points on their next purchase.</p>
              </div>
              
              <div className="loyalty-actions" style={{ maxWidth: '400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="loyalty-info-box" style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', textAlign: 'left' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lifetime Earned</span>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{customer.loyaltyPoints || 0}</div>
                </div>
                <div className="loyalty-info-box" style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', textAlign: 'left' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Points Redeemed</span>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>0</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content custom-modal">
            <div className="modal-header">
              <div className="header-icon-title">
                <div className="header-icon-box">
                  <User size={20} color="var(--primary-color)" />
                </div>
                <h2>Edit Customer</h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <div className="input-with-icon-premium">
                    <div className="icon-wrapper"><User size={18} /></div>
                    <input type="text" name="name" className="form-control premium-input" value={formData.name} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Mobile</label>
                    <div className="input-with-icon-premium">
                      <div className="icon-wrapper"><Phone size={18} /></div>
                      <input type="text" name="mobile" className="form-control premium-input" value={formData.mobile} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-with-icon-premium">
                      <div className="icon-wrapper"><Mail size={18} /></div>
                      <input type="email" name="email" className="form-control premium-input" value={formData.email} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <div className="input-with-icon-premium align-top">
                    <div className="icon-wrapper"><MapPin size={18} /></div>
                    <textarea name="address" className="form-control premium-input" rows="3" value={formData.address} onChange={handleInputChange} required></textarea>
                  </div>
                </div>
                <div className="form-group">
                  <label>Loyalty Points</label>
                  <div className="input-with-icon-premium">
                    <div className="icon-wrapper"><Award size={18} /></div>
                    <input type="number" name="loyaltyPoints" className="form-control premium-input" value={formData.loyaltyPoints} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-premium" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary-premium" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <OrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
          setIsViewOnly(false);
        }}
        customer={customer}
        categories={categories}
        orderToEdit={editingOrder}
        isViewOnly={isViewOnly}
      />

    </div>
  );
};

export default CustomerDetails;
