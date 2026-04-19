import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  FileText, 
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

const PriceList = () => {
  const navigate = useNavigate();
  const { selectedLocation, locations } = useLocation();
  const [priceLists, setPriceLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, listId: null });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationId: ''
  });

  useEffect(() => {
    setLoading(true);
    let q;
    if (selectedLocation === 'all') {
      q = query(collection(db, 'priceLists'), orderBy('name', 'asc'));
    } else {
      q = query(collection(db, 'priceLists'), where('locationId', '==', selectedLocation));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listsData = [];
      querySnapshot.forEach((doc) => {
        listsData.push({ id: doc.id, ...doc.data() });
      });
      
      if (selectedLocation !== 'all') {
        listsData.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setPriceLists(listsData);
      setLoading(false);
    }, (error) => {
      toast.error("Error loading price lists.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (list = null) => {
    if (list) {
      setEditingList(list);
      setFormData({
        name: list.name,
        description: list.description || '',
        locationId: list.locationId || ''
      });
    } else {
      setEditingList(null);
      setFormData({
        name: '',
        description: '',
        locationId: selectedLocation !== 'all' ? selectedLocation : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSavePriceList = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading(editingList ? 'Updating price list...' : 'Creating price list...');
    try {
      if (editingList) {
        await updateDoc(doc(db, 'priceLists', editingList.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Price list updated successfully!', { id: saveToast });
      } else {
        await addDoc(collection(db, 'priceLists'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Price list created successfully!', { id: saveToast });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error saving price list.", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePriceList = async () => {
    const deleteToast = toast.loading('Deleting price list...');
    try {
      await deleteDoc(doc(db, 'priceLists', confirmDelete.listId));
      toast.success('Price list deleted successfully!', { id: deleteToast });
    } catch (error) {
      toast.error("Error deleting price list.", { id: deleteToast });
    }
  };

  return (
    <div className="pricelist-page">
      <div className="page-header">
        <div>
          <h1>Price Lists Management</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Price Lists</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Create Price List
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Price Lists</h3>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>LIST NAME</th>
                <th>DESCRIPTION</th>
                <th>CREATED DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="spinner" size={24} />
                  </td>
                </tr>
              ) : priceLists.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No price lists found.</td>
                </tr>
              ) : (
                priceLists.map((list) => (
                  <tr key={list.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="var(--primary-color)" />
                        <span style={{ fontWeight: 600 }}>{list.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{list.description || 'No description'}</td>
                    <td style={{ fontSize: '13px' }}>{new Date(list.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-btn-ui" onClick={() => navigate(`/pricelist/${list.id}`)} title="Manage Prices">
                          <Eye size={18} color="#64748b" />
                        </button>
                        <button className="action-btn-ui" onClick={() => handleOpenModal(list)} title="Edit Info">
                          <Edit size={18} color="#3b71fe" />
                        </button>
                        <button className="action-btn-ui" onClick={() => setConfirmDelete({ isOpen: true, listId: list.id })} title="Delete">
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

      {/* Price List Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingList ? 'Edit Price List' : 'Create Price List'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSavePriceList}>
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
                  <label>Price List Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Standard Summer Rates"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea 
                    name="description" 
                    className="form-control" 
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe who this list is for"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : (editingList ? 'Update List' : 'Create List')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, listId: null })}
        onConfirm={handleDeletePriceList}
        title="Delete Price List"
        message="Are you sure you want to delete this price list? Shops assigned to this list may lose their custom pricing."
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
      `}</style>
    </div>
  );
};

export default PriceList;
