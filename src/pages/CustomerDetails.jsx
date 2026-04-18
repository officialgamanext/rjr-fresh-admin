import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc 
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
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';
import '../css/pages/customer-details.css';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: ''
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
            address: data.address
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
                  <div className="meta-pill"><Clock size={14} /> Last Update: {new Date(customer.updatedAt).toLocaleTimeString()}</div>
                </div>
                <div className="customer-id-badge">ID: {customer.id}</div>
              </div>
            </div>

            <div className="quick-stats-sidebar">
              <div className="card stat-summary-card">
                <h3>Quick Stats</h3>
                <div className="stat-item">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">0</span>
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
              <button className="btn-primary"><Plus size={18} /> New Order</button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>DATE</th>
                    <th>ITEMS</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                      No orders found for this customer.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Customer</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="name" className="form-control" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input type="text" name="mobile" className="form-control" value={formData.mobile} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea name="address" className="form-control" rows="3" value={formData.address} onChange={handleInputChange} required></textarea>
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

    </div>
  );
};

export default CustomerDetails;
