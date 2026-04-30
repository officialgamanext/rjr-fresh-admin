import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  Moon,
  Maximize,
  Plus,
  Clock,
  MapPin,
  ChevronDown,
  PlusCircle,
  X,
  Check,
  LogOut
} from 'lucide-react';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../css/components/topbar.css';

const Topbar = () => {
  const { selectedLocation, locations, changeLocation, addLocation } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;

    try {
      await addLocation(newLocationName.trim());
      setNewLocationName('');
      setIsAdding(false);
      toast.success('Location added successfully');
    } catch (error) {
      toast.error('Failed to add location');
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLocName = selectedLocation === 'all'
    ? 'All Locations'
    : locations.find(l => l.id === selectedLocation)?.name || 'Select Location';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle">
          <Menu size={20} />
        </button>

        <div className="location-selector-container" ref={dropdownRef}>
          <button
            className="location-btn"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} className="location-icon" />
              <span className="location-name">{selectedLocName}</span>
            </div>
            <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
          </button>

          {isOpen && (
            <div className="location-dropdown">
              <div className="dropdown-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="dropdown-list">
                <div
                  className={`dropdown-item ${selectedLocation === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    changeLocation('all');
                    setIsOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={16} />
                    <span>All Locations</span>
                  </div>
                  {selectedLocation === 'all' && <Check size={14} />}
                </div>
                {filteredLocations.map(loc => (
                  <div
                    key={loc.id}
                    className={`dropdown-item ${selectedLocation === loc.id ? 'active' : ''}`}
                    onClick={() => {
                      changeLocation(loc.id);
                      setIsOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={16} />
                      <span>{loc.name}</span>
                    </div>
                    {selectedLocation === loc.id && <Check size={14} />}
                  </div>
                ))}
              </div>

              <div className="dropdown-footer">
                {!isAdding ? (
                  <button className="add-location-btn" onClick={() => setIsAdding(true)}>
                    <PlusCircle size={16} />
                    <span>Add New Location</span>
                  </button>
                ) : (
                  <form className="add-location-form" onSubmit={handleAddLocation}>
                    <input
                      type="text"
                      placeholder="Location name"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      autoFocus
                    />
                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>
                        <X size={16} />
                      </button>
                      <button type="submit" className="confirm-btn">
                        <Plus size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button 
          className="action-btn" 
          onClick={handleLogout}
          title="Sign Out"
          style={{ color: '#ef4444' }}
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
