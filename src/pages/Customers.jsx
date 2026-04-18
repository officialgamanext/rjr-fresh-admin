import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  MapPin 
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customerData = [];
      snapshot.forEach((doc) => customerData.push({ id: doc.id, ...doc.data() }));
      setCustomers(customerData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const generateCustomerId = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    // Format: DDMMYYMMSS as requested
    return `${day}${month}${year}${mins}${secs}`;
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setFormData({
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email || '',
        address: customer.address
      });
      setSelectedCustomer(customer);
    } else {
      setFormData({
        name: '',
        mobile: '',
        email: '',
        address: ''
      });
      setSelectedCustomer(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading(selectedCustomer ? 'Updating customer...' : 'Adding customer...');

    try {
      const customerId = selectedCustomer ? selectedCustomer.id : generateCustomerId();
      await setDoc(doc(db, 'customers', customerId), {
        ...formData,
        updatedAt: new Date().toISOString(),
        createdAt: selectedCustomer ? selectedCustomer.createdAt : new Date().toISOString()
      }, { merge: true });

      toast.success(selectedCustomer ? 'Customer updated!' : 'Customer added!', { id: saveToast });
      handleCloseModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Error saving customer", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const deleteToast = toast.loading('Deleting customer...');
    try {
      await deleteDoc(doc(db, 'customers', selectedCustomer.id));
      toast.success('Customer deleted', { id: deleteToast });
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error('Error deleting customer', { id: deleteToast });
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile.includes(searchQuery)
  );

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Customers</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search by name or mobile..." 
              className="form-control"
              style={{ paddingLeft: '36px', width: '300px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>CUSTOMER NAME</th>
                <th>MOBILE NUMBER</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="spinner" /></td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>No customers found.</td></tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="avatar-info">
                        <div className="avatar" style={{ backgroundColor: '#f1f5f9' }}>
                          <User size={18} color="var(--primary-color)" />
                        </div>
                        <div>
                          <span className="info-name" style={{ fontWeight: 600 }}>{customer.name}</span>
                          <span className="info-sub" style={{ fontSize: '12px' }}>ID: {customer.id}</span>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 500 }}>{customer.mobile}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-btn-ui" onClick={() => navigate(`/customers/${customer.id}`)} title="View Detail">
                          <Eye size={18} color="#64748b" />
                        </button>
                        <button className="action-btn-ui" onClick={() => handleOpenModal(customer)} title="Edit">
                          <Edit size={18} color="#3b71fe" />
                        </button>
                        <button className="action-btn-ui" onClick={() => handleDeleteClick(customer)} title="Delete">
                          <Trash2 size={18} color="#ef4444" />
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="close-btn" onClick={handleCloseModal}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Name</label>
                  <div className="input-with-icon">
                    <User size={18} />
                    <input type="text" name="name" className="form-control" placeholder="Enter name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <div className="input-with-icon">
                      <Phone size={18} />
                      <input type="text" name="mobile" className="form-control" placeholder="10-digit mobile" value={formData.mobile} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email (Optional)</label>
                    <div className="input-with-icon">
                      <Mail size={18} />
                      <input type="email" name="email" className="form-control" placeholder="Email address" value={formData.email} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <div className="input-with-icon" style={{ alignItems: 'flex-start' }}>
                    <MapPin size={18} style={{ marginTop: '10px' }} />
                    <textarea name="address" className="form-control" rows="3" placeholder="Full address" value={formData.address} onChange={handleInputChange} required></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : (selectedCustomer ? 'Update Customer' : 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${selectedCustomer?.name}? This action cannot be undone.`}
      />

      <style>{`
        .action-btn-ui { padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; border: none; background: transparent; cursor: pointer; }
        .action-btn-ui:hover { background-color: #f1f5f9; }
        .input-with-icon { position: relative; }
        .input-with-icon svg { position: absolute; left: 12px; top: 11px; color: var(--text-muted); }
        .input-with-icon .form-control { padding-left: 40px; }
        .spinner { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Customers;
