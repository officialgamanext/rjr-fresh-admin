import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Maximize, 
  Moon, 
  Bell, 
  Globe,
  MapPin,
  ChevronDown,
  X
} from 'lucide-react';
import { useLocation } from '../LocationContext';
import '../css/Header.css';

const Header = () => {
  const { selectedLocation, setSelectedLocation, locations } = useLocation();
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="header-container">
      <div className="header-left">
        <button className="menu-toggle">
          <Menu size={20} />
        </button>
        
        <div className="custom-dropdown-container">
          <button 
            className="dropdown-trigger" 
            onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
          >
            <MapPin size={16} className="loc-icon" />
            <span className="selected-text">{selectedLocation ? selectedLocation.name : 'Select Location'}</span>
            <ChevronDown size={14} className={`arrow ${isLocDropdownOpen ? 'open' : ''}`} />
          </button>

          {isLocDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-search">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Search location..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && <X size={14} className="clear-search" onClick={() => setSearchQuery('')} />}
              </div>
              <ul className="dropdown-list">
                {filteredLocations.map((loc) => (
                  <li 
                    key={loc.id} 
                    className={`dropdown-item ${selectedLocation?.id === loc.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setIsLocDropdownOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <MapPin size={14} />
                    <span>{loc.name}</span>
                  </li>
                ))}
                {filteredLocations.length === 0 && (
                  <li className="no-results">No locations found</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="action-btn">
            <Search size={20} />
          </button>
          <button className="action-btn flag-btn">
             <Globe size={20} />
          </button>
          <button className="action-btn">
            <Maximize size={20} />
          </button>
          <button className="action-btn">
            <Moon size={20} />
          </button>
          <button className="action-btn notification-btn">
            <Bell size={20} />
            <span className="badge">3</span>
          </button>
        </div>

        <div className="user-profile">
          <div className="avatar-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
              alt="User" 
              className="user-avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
