import React, { useState, useEffect } from 'react';
import '../css/Items.css';
import {
  Package,
  Plus,
  X,
  Loader2,
  Search,
  Trash2,
  Pencil,
  Tag,
  IndianRupee,
  Layers,
  MoreVertical
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', unit: 'pcs', category: 'General' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const itemList = [];
      querySnapshot.forEach((doc) => {
        itemList.push({ id: doc.id, ...doc.data() });
      });
      setItems(itemList);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSaving(true);
      if (editingId) {
        await updateDoc(doc(db, "items", editingId), {
          ...formData,
          price: parseFloat(formData.price)
        });
      } else {
        await addDoc(collection(db, "items"), {
          ...formData,
          price: parseFloat(formData.price),
          createdAt: serverTimestamp()
        });
      }

      setFormData({ name: '', price: '', unit: 'pcs', category: 'General' });
      setEditingId(null);
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setFormData({ name: item.name, price: item.price, unit: item.unit, category: item.category });
    setShowForm(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteDoc(doc(db, "items", id));
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="header-title-section">
          <h2 className="page-title">Items Management</h2>
          <p className="subtitle">Manage your product catalog</p>
        </div>
        <button
          className={showForm ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', price: '', unit: 'pcs', category: 'General' });
          }}
        >
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add New Item</>}
        </button>
      </div>

      {showForm && (
        <div className="add-item-section">
          <form onSubmit={handleSaveItem} className="add-item-form">
            <div className="form-group">
              <label>Item Name</label>
              <div className="input-with-icon">
                <Tag size={16} />
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter item name..."
                  autoFocus
                />
              </div>
            </div>
            <div className="form-group full">
              <label>Price</label>
              <div className="input-with-icon">
                <IndianRupee size={16} />
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? 'Update' : 'Save')}
            </button>
          </form>
        </div>
      )}

      <div className="items-toolbar">
        <div className="search-bar-modern">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={40} className="animate-spin" />
          <p>Loading items...</p>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-card-header">
                  <div className="category-tag"><Layers size={14} />{item.category || 'General'}</div>
                  <div className="card-actions">
                    <button className="btn-icon-sm" onClick={() => startEdit(item)}>
                      <Pencil size={16} />
                    </button>
                    <button className="btn-icon-sm delete" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="item-card-body">
                  <div className="item-icon-wrapper">
                    <Package size={24} />
                  </div>
                  <h4 className="item-name">{item.name}</h4>
                </div>
                {/* <div className="item-card-footer">
                  <div className="price-info">
                    <span className="price-amount">₹{item.price}</span>
                    <span className="unit-label">/ {item.unit}</span>
                  </div>
                  <span className="item-id-text">ID: {item.id.slice(0, 8)}</span>
                  <button className="btn-view-more">
                    <MoreVertical size={16} />
                  </button>
                </div> */}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No items found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Items;
