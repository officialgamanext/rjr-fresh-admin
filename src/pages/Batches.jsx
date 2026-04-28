import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Box, Edit2, Trash2 } from 'lucide-react';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import BatchModal from '../components/modals/BatchModal';
import toast from 'react-hot-toast';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBatches(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load batches");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await deleteDoc(doc(db, 'batches', id));
        toast.success('Batch deleted successfully');
      } catch (error) {
        console.error("Error deleting batch:", error);
        toast.error('Failed to delete batch');
      }
    }
  };

  const handleEdit = (batch) => {
    setBatchToEdit(batch);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setBatchToEdit(null);
    setIsModalOpen(true);
  };

  const filteredBatches = batches.filter(batch => 
    (batch.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box color="var(--primary-color)" /> Batches
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage product batches and manufacturing dates</p>
        </div>
        <button className="btn-primary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add Batch
        </button>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="Search by batch number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '36px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>BATCH NUMBER</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>MANUFACTURED DATE</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>USED DATE</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>CREATED ON</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px'}}><Loader2 className="spinner" size={24} color="var(--primary-color)" /></td></tr>
              ) : filteredBatches.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No batches found.</td></tr>
              ) : filteredBatches.map(batch => (
                <tr key={batch.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{batch.batchNumber}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{batch.manufacturedDate ? new Date(batch.manufacturedDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{batch.usedDate ? new Date(batch.usedDate).toLocaleDateString() : '-'}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(batch.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        className="action-btn-ui edit-btn-ui" 
                        onClick={() => handleEdit(batch)}
                        title="Edit Batch"
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#eff6ff', color: '#3b82f6', cursor: 'pointer' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="action-btn-ui delete-btn-ui" 
                        onClick={() => handleDelete(batch.id)}
                        title="Delete Batch"
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BatchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batchToEdit={batchToEdit}
      />
    </div>
  );
};

export default Batches;
