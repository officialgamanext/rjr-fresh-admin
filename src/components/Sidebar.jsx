import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  ClipboardList,
  CreditCard,
  ChevronRight,
  Layers,
  Tag,
  LogOut,
  Box,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../css/components/sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { title: 'Dashboard', icon: <LayoutDashboard />, path: '/' },
    { title: 'Shops', icon: <Store />, path: '/shops' },
    { title: 'Shop Orders', icon: <Package />, path: '/shop-orders' },
    { title: 'Return Orders', icon: <RefreshCw />, path: '/return-orders' },
    { title: 'Payments', icon: <CreditCard />, path: '/payments' },
    { title: 'Customers', icon: <Users />, path: '/customers' },
    { title: 'Customer Orders', icon: <Package />, path: '/customer-orders' },
    { title: 'Customer Prices', icon: <Tag />, path: '/customer-prices' },
    { title: 'Batches', icon: <Box />, path: '/batches' },
    { title: 'Items', icon: <Package />, path: '/items' },
    { title: 'Item Categories', icon: <Layers />, path: '/categories' },
    { title: 'Employees', icon: <Users />, path: '/employees' },
    { title: 'Price List', icon: <ClipboardList />, path: '/pricelist' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        RJR FRESH
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <h3 className="section-title">Navigation</h3>
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <ChevronRight className="nav-item-chevron" />
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px', background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: 600, fontSize: '14px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
