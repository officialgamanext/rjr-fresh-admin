import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  X,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation } from '../contexts/LocationContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';

const Shops = () => {
  const navigate = useNavigate();
  const { selectedLocation, locations } = useLocation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Custom Confirmation Modal state
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, shopId: null });

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    mobile: '',
    address: '',
    locationId: '',
    status: 'Active'
  });

  // Fetch shops from Firebase
  useEffect(() => {
    setLoading(true);
    let q;
    if (selectedLocation === 'all') {
      q = query(collection(db, 'shops'), orderBy('name', 'asc'));
    } else {
      // Filtering and ordering on different fields requires a composite index.
      // We'll filter by location and sort locally to avoid index errors for now.
      q = query(collection(db, 'shops'), where('locationId', '==', selectedLocation));
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const shopsData = [];
      querySnapshot.forEach((doc) => {
        shopsData.push({ id: doc.id, ...doc.data() });
      });
      
      // Local sort if we didn't use Firestore orderBy
      if (selectedLocation !== 'all') {
        shopsData.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setShops(shopsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      toast.error("Error loading shops.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (shop = null) => {
    if (shop) {
      setEditingShop(shop);
      setFormData({
        name: shop.name,
        latitude: shop.latitude,
        longitude: shop.longitude,
        mobile: shop.mobile,
        address: shop.address,
        locationId: shop.locationId || '',
        status: shop.status || 'Active'
      });
    } else {
      setEditingShop(null);
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        mobile: '',
        address: '',
        locationId: selectedLocation !== 'all' ? selectedLocation : '',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShop(null);
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading(editingShop ? 'Updating shop...' : 'Adding shop...');
    try {
      if (editingShop) {
        const shopRef = doc(db, 'shops', editingShop.id);
        await updateDoc(shopRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Shop updated successfully!', { id: saveToast });
      } else {
        await addDoc(collection(db, 'shops'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Shop added successfully!', { id: saveToast });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving shop: ", error);
      toast.error("Error saving shop. Please check your Firebase rules.", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShop = async () => {
    const id = confirmDelete.shopId;
    const deleteToast = toast.loading('Deleting shop...');
    try {
      await deleteDoc(doc(db, 'shops', id));
      toast.success('Shop deleted successfully!', { id: deleteToast });
    } catch (error) {
      console.error("Error deleting shop: ", error);
      toast.error("Error deleting shop.", { id: deleteToast });
    }
  };

  const handleViewShop = (shopId) => {
    navigate(`/shops/${shopId}`);
  };

  return (
    <div className="shops-page">
      <div className="page-header">
        <div>
          <h1>Shops</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Shops List</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Add New Shop
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search shops..." 
                className="form-control"
                style={{ paddingLeft: '36px', width: '280px' }} 
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            <button className="mega-menu-btn" style={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>SHOP NAME</th>
                <th>LOCATION</th>
                <th>MOBILE</th>
                <th>LATITUDE</th>
                <th>LONGITUDE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                      <Loader2 size={20} className="spinner" /> Loading shops...
                    </div>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No shops found. Click "Add New Shop" to create one.</td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id}>
                    <td>
                      <div className="info-name">{shop.name}</div>
                      <div className="info-sub" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shop.address}
                      </div>
                    </td>
                    <td>
                      <div className="status-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontWeight: 600 }}>
                        {locations.find(l => l.id === shop.locationId)?.name || 'N/A'}
                      </div>
                    </td>
                    <td>{shop.mobile}</td>
                    <td>{shop.latitude}</td>
                    <td>{shop.longitude}</td>
                    <td>
                      <span className={`status-badge status-${shop.status === 'Active' ? 'success' : 'danger'}`}>
                        {shop.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleViewShop(shop.id)} className="action-btn-ui" title="View">
                          <Eye size={18} color="#64748b" />
                        </button>
                        <button onClick={() => handleOpenModal(shop)} className="action-btn-ui" title="Edit">
                          <Edit size={18} color="#3b71fe" />
                        </button>
                        <button onClick={() => setConfirmDelete({ isOpen: true, shopId: shop.id })} className="action-btn-ui" title="Delete">
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
              <button className="close-btn" onClick={handleCloseModal}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveShop}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Location</label>
                  <select 
                    name="locationId" 
                    className="form-control" 
                    value={formData.locationId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    name="status" 
                    className="form-control" 
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Shop Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    placeholder="Enter shop name"
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
                      placeholder="e.g. 17.3850"
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
                      placeholder="e.g. 78.4867"
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
                    placeholder="Enter mobile number"
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
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save Shop'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, shopId: null })}
        onConfirm={handleDeleteShop}
        title="Delete Shop"
        message="Are you sure you want to delete this shop? This action cannot be undone."
        confirmText="Yes, Delete"
      />

      <style>{`
        .action-btn-ui {
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .action-btn-ui:hover {
          background-color: #f1f5f9;
        }
        .spinner {
          animation: rotate 1s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Shops;
