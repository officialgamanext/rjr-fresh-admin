import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Tag, 
  MoreVertical, 
  Edit, 
  Trash2, 
  X, 
  Loader2,
  Layers
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

const Items = () => {
  const { selectedLocation, locations } = useLocation();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, itemId: null });

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'kg',
    hsnCode: '',
    locationId: ''
  });

  const [categoryData, setCategoryData] = useState({
    name: '',
    shortCode: ''
  });

  // Fetch items
  useEffect(() => {
    setLoading(true);
    let q;
    if (selectedLocation === 'all') {
      q = query(collection(db, 'items'), orderBy('name', 'asc'));
    } else {
      q = query(collection(db, 'items'), where('locationId', '==', selectedLocation));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() });
      });
      
      if (selectedLocation !== 'all') {
        itemsData.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setItems(itemsData);
      setLoading(false);
    }, (error) => {
      toast.error("Error loading items.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedLocation]);

  // Fetch categories
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const cats = [];
      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() });
      });
      setCategories(cats);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        hsnCode: item.hsnCode || '',
        locationId: item.locationId || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: categories.length > 0 ? categories[0].name : '',
        unit: 'kg',
        hsnCode: '',
        locationId: selectedLocation !== 'all' ? selectedLocation : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      toast.error("Please select a category first.");
      return;
    }
    if (!formData.locationId) {
      toast.error("Please select a location.");
      return;
    }
    setSaving(true);
    const saveToast = toast.loading(editingItem ? 'Updating item...' : 'Adding item...');
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'items', editingItem.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Item updated successfully!', { id: saveToast });
      } else {
        await addDoc(collection(db, 'items'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Item added successfully!', { id: saveToast });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error saving item.", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    const catToast = toast.loading('Adding category...');
    try {
      await addDoc(collection(db, 'categories'), {
        ...categoryData,
        createdAt: new Date().toISOString()
      });
      toast.success('Category added!', { id: catToast });
      setCategoryData({ name: '', shortCode: '' });
      setIsCategoryModalOpen(false);
    } catch (error) {
      toast.error("Error adding category.", { id: catToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    const deleteToast = toast.loading('Deleting item...');
    try {
      await deleteDoc(doc(db, 'items', confirmDelete.itemId));
      toast.success('Item deleted successfully!', { id: deleteToast });
    } catch (error) {
      toast.error("Error deleting item.", { id: deleteToast });
    }
  };

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Inventory Items</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Items List</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => setIsCategoryModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} />
            Add Category
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search items..." 
              className="form-control"
              style={{ paddingLeft: '36px', width: '300px' }} 
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ITEM NAME</th>
                <th>CATEGORY</th>
                <th>UNIT</th>
                <th>HSN</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 className="spinner" size={24} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No items found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={16} color="var(--primary-color)" />
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontWeight: 600 }}>
                        {item.category}
                      </span>
                    </td>
                    <td><span className="status-badge" style={{ backgroundColor: '#f1f5f9' }}>{item.unit}</span></td>
                    <td>{item.hsnCode || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-btn-ui" onClick={() => handleOpenModal(item)} title="Edit">
                          <Edit size={18} color="#3b71fe" />
                        </button>
                        <button className="action-btn-ui" onClick={() => setConfirmDelete({ isOpen: true, itemId: item.id })} title="Delete">
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

      {/* Item Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveItem}>
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
                  <label>Item Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Fresh Tomato"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  {categories.length === 0 ? (
                    <div style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px' }}>
                      Please add a category first!
                    </div>
                  ) : (
                    <select 
                      name="category" 
                      className="form-control" 
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name} ({cat.shortCode})</option>
                      ))}
                    </select>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Unit</label>
                    <select 
                      name="unit" 
                      className="form-control" 
                      value={formData.unit}
                      onChange={handleInputChange}
                    >
                      <option value="kg">kg</option>
                      <option value="gram">g</option>
                      <option value="pcs">pcs</option>
                      <option value="ltr">ltr</option>
                      <option value="box">Box</option>
                      <option value="pkt">Pkt</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>HSN Code</label>
                    <input 
                      type="text" 
                      name="hsnCode" 
                      className="form-control" 
                      value={formData.hsnCode}
                      onChange={handleInputChange}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving || categories.length === 0}>
                  {saving ? <Loader2 size={18} className="spinner" /> : (editingItem ? 'Update Item' : 'Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add New Category</h2>
              <button className="close-btn" onClick={() => setIsCategoryModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    value={categoryData.name}
                    onChange={handleCategoryInputChange}
                    placeholder="e.g. Vegetables"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Short Code</label>
                  <input 
                    type="text" 
                    name="shortCode" 
                    className="form-control" 
                    value={categoryData.shortCode}
                    onChange={handleCategoryInputChange}
                    placeholder="e.g. VEG"
                    required 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, itemId: null })}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
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

export default Items;
