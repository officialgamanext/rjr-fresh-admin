import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import '../css/components/custom-dropdown.css';

const CustomDropdown = ({ options, value, onChange, placeholder = "Select...", disabled = false, searchable = false, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div className={`custom-dropdown ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <div 
        className={`dropdown-header ${isOpen ? 'open' : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && <span className="dropdown-icon">{icon}</span>}
          <span className={selectedOption ? 'selected-text' : 'placeholder-text'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </div>
      
      {isOpen && !disabled && (
        <div className="dropdown-body">
          {searchable && (
            <div className="dropdown-search">
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="dropdown-list">
            {filteredOptions.length === 0 ? (
              <div className="no-options">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.value} 
                  className={`dropdown-item ${opt.value === value ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
