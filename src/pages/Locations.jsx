import React, { useState, useEffect } from 'react';
import '../css/Locations.css';
import { MapPin, Navigation, Globe, MoreHorizontal, Plus, X, Loader2, Pencil, Trash2, Check } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useLocation } from '../LocationContext';

const Locations = () => {
  const { locations: contextLocations, fetchLocations: refreshContext } = useLocation();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // We still fetch locally for specific page features but we sync with context
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const locs = [];
      querySnapshot.forEach((doc) => {
        locs.push({ id: doc.id, ...doc.data() });
      });
      setLocations(locs);
      refreshContext(); // Keep header in sync
    } catch (error) {
      console.error("Error fetching locations: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;

    try {
      setIsSaving(true);
      await addDoc(collection(db, "locations"), {
        name: newLocationName,
        createdAt: serverTimestamp(),
        type: 'Distribution Center',
        status: 'Active',
        stores: 0
      });
      
      setNewLocationName('');
      setShowForm(false);
      fetchLocations();
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;
    try {
      await deleteDoc(doc(db, "locations", id));
      fetchLocations();
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const startEdit = (loc) => {
    setEditingId(loc.id);
    setEditValue(loc.name);
  };

  const handleUpdateLocation = async (id) => {
    if (!editValue.trim()) return;
    try {
      const locRef = doc(db, "locations", id);
      await updateDoc(locRef, {
        name: editValue
      });
      setEditingId(null);
      fetchLocations();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Locations</h2>
        <button 
          className={`btn-primary ${showForm ? 'btn-danger' : ''}`} 
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
        >
          {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add New Location</>}
        </button>
      </div>

      {showForm && (
        <div className="add-location-section">
          <form onSubmit={handleSaveLocation} className="add-location-form">
            <div className="form-group">
              <label htmlFor="locationName">Location Name</label>
              <input 
                id="locationName"
                type="text" 
                placeholder="Enter location name..." 
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Location'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <Loader2 size={40} className="animate-spin" />
          <p>Loading locations...</p>
        </div>
      ) : (
        <div className="locations-grid">
          {locations.length > 0 ? (
            locations.map((loc) => (
              <div key={loc.id} className="location-card">
                <div className="card-header">
                  <div className="icon-wrapper">
                    <MapPin size={20} />
                  </div>
                  <div className="card-actions">
                    <button className="btn-action edit" onClick={() => startEdit(loc)} title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className="btn-action delete" onClick={() => handleDeleteLocation(loc.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {editingId === loc.id ? (
                    <div className="inline-edit">
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <div className="edit-buttons">
                        <button className="btn-confirm" onClick={() => handleUpdateLocation(loc.id)}>
                          <Check size={16} />
                        </button>
                        <button className="btn-cancel" onClick={() => setEditingId(null)}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="loc-name">{loc.name}</h3>
                      <p className="loc-type">{loc.type || 'Regional Hub'}</p>
                    </>
                  )}
                  <div className="loc-info">
                    <div className="info-item">
                      <Navigation size={14} />
                      <span>{loc.address || 'Address not set'}</span>
                    </div>
                    <div className="info-item">
                      <Globe size={14} />
                      <span>{loc.stores || 0} connected stores</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className={`status-pill ${(loc.status || 'active').toLowerCase()}`}>
                    {loc.status || 'Active'}
                  </span>
                  <button className="btn-text">View Details</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No locations found. Add your first location!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Locations;
