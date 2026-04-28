import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

const BatchModal = ({ isOpen, onClose, batchToEdit }) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturedDate, setManufacturedDate] = useState('');
  const [usedDate, setUsedDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (batchToEdit) {
      setBatchNumber(batchToEdit.batchNumber || '');
      setManufacturedDate(batchToEdit.manufacturedDate || '');
      setUsedDate(batchToEdit.usedDate || '');
    } else {
      setBatchNumber('');
      setManufacturedDate('');
      setUsedDate('');
    }
  }, [batchToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!batchNumber) {
      return toast.error("Batch number is required");
    }

    setSaving(true);
    const loadingToast = toast.loading(batchToEdit ? "Updating batch..." : "Saving batch...");

    try {
      const batchData = {
        batchNumber,
        manufacturedDate,
        usedDate,
        updatedAt: new Date().toISOString()
      };

      if (batchToEdit) {
        await updateDoc(doc(db, 'batches', batchToEdit.id), batchData);
        toast.success('Batch updated successfully!', { id: loadingToast });
      } else {
        batchData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'batches'), batchData);
        toast.success('Batch added successfully!', { id: loadingToast });
      }
      onClose();
    } catch (error) {
      console.error("Error saving batch:", error);
      toast.error('Failed to save batch', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>{batchToEdit ? 'Edit Batch' : 'Add New Batch'}</h2>
          <button className="close-btn" onClick={onClose} disabled={saving}><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label>Batch Number <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Enter batch number"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Manufactured Date</label>
              <input
                type="date"
                className="form-control"
                value={manufacturedDate}
                onChange={(e) => setManufacturedDate(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Used Date</label>
              <input
                type="date"
                className="form-control"
                value={usedDate}
                onChange={(e) => setUsedDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={18} className="spinner" /> : 'Save Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchModal;
