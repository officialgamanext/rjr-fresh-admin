import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Stores.css';
import { 
  Store as StoreIcon, 
  Plus, 
  X, 
  Loader2, 
  Phone, 
  MapPin, 
  Navigation,
  Search,
  Trash2,
  ChevronDown,
  Pencil
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  where, 
  doc, 
  updateDoc, 
  increment,
  deleteDoc
} from 'firebase/firestore';
import { useLocation } from '../LocationContext';

const Stores = () => {
  const navigate = useNavigate();
  const { selectedLocation, locations, fetchLocations: refreshLocationCounts } = useLocation();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [editingStore, setEditingStore] = useState(null);

  // Custom Dropdown State for Modal
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [modalSelectedLoc, setModalSelectedLoc] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    lat: '',
    lng: ''
  });

  useEffect(() => {
    fetchStores();
  }, [selectedLocation]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      console.log("Fetching stores for location:", selectedLocation);
      let q;
      if (!selectedLocation || selectedLocation.id === 'all') {
        q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'));
      } else {
        // Removing orderBy here for now to avoid missing index errors
        q = query(
          collection(db, 'stores'), 
          where('locationId', '==', selectedLocation.id)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const storeList = [];
      querySnapshot.forEach((doc) => {
        storeList.push({ id: doc.id, ...doc.data() });
      });
      console.log("Fetched stores count:", storeList.length);
      setStores(storeList);
    } catch (error) {
      console.error("Error fetching stores: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modalSelectedLoc) {
      alert("Please select a location for the store.");
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingStore) {
        // Handle Update
        const oldLocationId = editingStore.locationId;
        const newLocationId = modalSelectedLoc.id;

        await updateDoc(doc(db, "stores", editingStore.id), {
          ...formData,
          locationId: newLocationId,
          locationName: modalSelectedLoc.name,
        });

        // Update counts if location changed
        if (oldLocationId !== newLocationId) {
          await updateDoc(doc(db, "locations", oldLocationId), { stores: increment(-1) });
          await updateDoc(doc(db, "locations", newLocationId), { stores: increment(1) });
        }
      } else {
        // Handle Create
        await addDoc(collection(db, "stores"), {
          ...formData,
          locationId: modalSelectedLoc.id,
          locationName: modalSelectedLoc.name,
          createdAt: serverTimestamp(),
          status: 'Open'
        });
        
        const locRef = doc(db, "locations", modalSelectedLoc.id);
        await updateDoc(locRef, { stores: increment(1) });
      }
      
      resetForm();
      setShowModal(false);
      fetchStores();
      refreshLocationCounts();
    } catch (error) {
      console.error("Error saving store: ", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', mobile: '', address: '', lat: '', lng: '' });
    setModalSelectedLoc(null);
    setEditingStore(null);
  };

  const handleEditClick = (e, store) => {
    e.stopPropagation();
    setEditingStore(store);
    setFormData({
      name: store.name,
      mobile: store.mobile,
      address: store.address,
      lat: store.lat,
      lng: store.lng
    });
    setModalSelectedLoc({ id: store.locationId, name: store.locationName });
    setShowModal(true);
  };

  const handleDeleteStore = async (e, store) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${store.name}?`)) return;

    try {
      await deleteDoc(doc(db, "stores", store.id));
      if (store.locationId) {
        const locRef = doc(db, "locations", store.locationId);
        await updateDoc(locRef, { stores: increment(-1) });
      }
      fetchStores();
      refreshLocationCounts();
    } catch (error) {
      console.error("Error deleting store: ", error);
    }
  };

  const filteredLocsForModal = locations.filter(loc => 
    loc.id !== 'all' && loc.name.toLowerCase().includes(locSearchQuery.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="header-title-section">
          <h2 className="page-title">Stores Management</h2>
          <p className="active-filter-text">Showing: <strong>{selectedLocation.name}</strong></p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} /> Add New Store
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={40} className="animate-spin" />
          <p>Loading stores...</p>
        </div>
      ) : (
        <div className="stores-list">
          {stores.length > 0 ? (
            stores.map((store) => (
              <div key={store.id} className="store-row-card clickable" onClick={() => navigate(`/stores/${store.id}`)}>
                <div className="store-main">
                  <div className="store-icon">
                    <StoreIcon size={24} />
                  </div>
                  <div className="store-name-section">
                    <h4 className="store-name">{store.name}</h4>
                    <p className="store-mobile"><Phone size={12} /> {store.mobile}</p>
                  </div>
                </div>

                <div className="store-details-mid">
                   <div className="detail-item">
                      <MapPin size={14} />
                      <span className="address-text">{store.address}</span>
                   </div>
                   <div className="detail-item loc-tag">
                      <Navigation size={14} />
                      <span>{store.locationName}</span>
                   </div>
                </div>

                <div className="store-status-section">
                  <span className={`status-tag ${(store.status || 'open').toLowerCase()}`}>
                    {store.status || 'Open'}
                  </span>
                  <div className="action-buttons">
                    <button className="btn-action edit" onClick={(e) => handleEditClick(e, store)}>
                      <Pencil size={18} />
                    </button>
                    <button className="btn-action delete" onClick={(e) => handleDeleteStore(e, store)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No stores found for <strong>{selectedLocation.name}</strong>.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{editingStore ? 'Edit Store' : 'Add New Store'}</h3>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full">
                  <label>Store Name</label>
                  <input 
                    name="name" 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter store name" 
                  />
                </div>
                
                <div className="form-group full">
                  <label>Assign Location</label>
                  <div className="modal-dropdown-container">
                    <div 
                      className={`modal-dropdown-trigger ${isLocDropdownOpen ? 'active' : ''}`}
                      onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                    >
                      <MapPin size={16} className="loc-icon" />
                      <span>{modalSelectedLoc ? modalSelectedLoc.name : 'Select a location...'}</span>
                      <ChevronDown size={14} />
                    </div>
                    {isLocDropdownOpen && (
                      <div className="modal-dropdown-menu">
                        <div className="dropdown-search">
                          <Search size={14} />
                          <input 
                            type="text" 
                            placeholder="Search locations..." 
                            value={locSearchQuery}
                            onChange={(e) => setLocSearchQuery(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <ul className="modal-dropdown-list">
                          {filteredLocsForModal.map(loc => (
                            <li key={loc.id} onClick={() => {
                              setModalSelectedLoc(loc);
                              setIsLocDropdownOpen(false);
                              setLocSearchQuery('');
                            }}>
                              {loc.name}
                            </li>
                          ))}
                          {filteredLocsForModal.length === 0 && <li className="no-res">No results</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group full">
                  <label>Mobile Number</label>
                  <input 
                    name="mobile" 
                    type="tel" 
                    required 
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number" 
                  />
                </div>
                <div className="form-group full">
                  <label>Address</label>
                  <textarea 
                    name="address" 
                    required 
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Latitude</label>
                  <input 
                    name="lat" 
                    type="text" 
                    required 
                    value={formData.lat}
                    onChange={handleInputChange}
                    placeholder="e.g. 17.38" 
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input 
                    name="lng" 
                    type="text" 
                    required 
                    value={formData.lng}
                    onChange={handleInputChange}
                    placeholder="e.g. 78.48" 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : (editingStore ? 'Update Store' : 'Save Store')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;
