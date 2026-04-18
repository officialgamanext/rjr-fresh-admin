import React from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Moon, 
  Maximize, 
  Plus,
  Clock
} from 'lucide-react';
import '../css/components/topbar.css';

const Topbar = () => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle">
          <Menu size={20} />
        </button>
        <button className="mega-menu-btn">Mega Menu</button>
      </div>
      
      <div className="topbar-right">
        <div className="topbar-actions">
          <button className="action-btn"><Search size={20} /></button>
          <button className="action-btn"><Maximize size={20} /></button>
          <button className="action-btn"><Moon size={20} /></button>
          <button className="action-btn">
            <Clock size={20} />
            <span className="badge badge-success">2</span>
          </button>
          <button className="action-btn">
            <Bell size={20} />
            <span className="badge badge-danger">3</span>
          </button>
        </div>
        
        <div className="user-profile">
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
            alt="User" 
            className="user-avatar" 
          />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
