import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Store,
  Package,
  ChevronRight,
  ChevronDown,
  Users
} from 'lucide-react';
import '../css/Sidebar.css';

const Sidebar = () => {
  const [openSubmenu, setOpenSubmenu] = useState('proposal');

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? '' : menu);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'locations', label: 'Locations', icon: MapPin, path: '/locations' },
    { id: 'stores', label: 'Stores', icon: Store, path: '/stores' },
    { id: 'items', label: 'Items', icon: Package, path: '/items' },
    { id: 'employees', label: 'Employees', icon: Users, path: '/employees' },
  ];

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo">
        <h1 className="logo-text">RJR FRESH</h1>
      </div>

      <div className="sidebar-nav">
        <p className="nav-subtitle">NAVIGATION</p>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.id} className="nav-item">
              {item.hasSub ? (
                <div
                  className={`nav-link-dropdown ${openSubmenu === item.id ? 'active' : ''}`}
                  onClick={() => toggleSubmenu(item.id)}
                >
                  <div className="nav-link-content">
                    <item.icon size={18} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {openSubmenu === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <div className="nav-link-content">
                    <item.icon size={18} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </div>
                </NavLink>
              )}

              {item.hasSub && openSubmenu === item.id && item.subItems && (
                <ul className="submenu-list">
                  {item.subItems.map((sub, idx) => (
                    <li key={idx}>
                      <NavLink
                        to={sub.path}
                        className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
                      >
                        {sub.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
