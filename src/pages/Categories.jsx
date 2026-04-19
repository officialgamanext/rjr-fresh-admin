import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Loader2,
  Layers,
  Tag
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import '../css/pages/dashboard.css';
import '../css/components/table.css';
import '../css/components/modal.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, catId: null });

  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
    description: ''
  });

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const catsData = [];
      querySnapshot.forEach((doc) => {
        catsData.push({ id: doc.id, ...doc.data() });
      });
      setCategories(catsData);
      setLoading(false);
    }, (error) => {
      toast.error("Error loading categories.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        shortCode: category.shortCode,
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        shortCode: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading(editingCategory ? 'Updating category...' : 'Adding category...');
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Category updated successfully!', { id: saveToast });
      } else {
        await addDoc(collection(db, 'categories'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Category added successfully!', { id: saveToast });
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Error saving category.", { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    const deleteToast = toast.loading('Deleting category...');
    try {
      await deleteDoc(doc(db, 'categories', confirmDelete.catId));
      toast.success('Category deleted successfully!', { id: deleteToast });
      setConfirmDelete({ isOpen: false, catId: null });
    } catch (error) {
      toast.error("Error deleting category.", { id: deleteToast });
    }
  };

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1>Item Categories</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Categories List</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Add New Category
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search categories..." 
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
                <th>CATEGORY NAME</th>
                <th>SHORT CODE</th>
                <th>DESCRIPTION</th>
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
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No categories found.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} color="var(--primary-color)" />
                        <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontWeight: 600 }}>
                        {cat.shortCode}
                      </span>
                    </td>
                    <td>{cat.description || 'No description'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="action-btn-ui" onClick={() => handleOpenModal(cat)} title="Edit">
                          <Edit size={18} color="#3b71fe" />
                        </button>
                        <button className="action-btn-ui" onClick={() => setConfirmDelete({ isOpen: true, catId: cat.id })} title="Delete">
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
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    value={formData.name}
                    onChange={handleInputChange}
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
                    value={formData.shortCode}
                    onChange={handleInputChange}
                    placeholder="e.g. VEG"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description" 
                    className="form-control" 
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional details about this category"
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spinner" /> : (editingCategory ? 'Update Category' : 'Save Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, catId: null })}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? Items assigned to this category will not be deleted, but they may lose their category reference."
      />

      <style>{`
        .action-btn-ui { padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .action-btn-ui:hover { background-color: #f1f5f9; }
        .spinner { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Categories;
