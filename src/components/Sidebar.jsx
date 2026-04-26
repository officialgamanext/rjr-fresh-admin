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
  Tag
} from 'lucide-react';
import '../css/components/sidebar.css';

const Sidebar = () => {
  const navItems = [
    { title: 'Dashboard', icon: <LayoutDashboard />, path: '/' },
    { title: 'Shops', icon: <Store />, path: '/shops' },
    { title: 'Customers', icon: <Users />, path: '/customers' },
    { title: 'Customer Prices', icon: <Tag />, path: '/customer-prices' },
    { title: 'Items', icon: <Package />, path: '/items' },
    { title: 'Item Categories', icon: <Layers />, path: '/categories' },
    { title: 'Employees', icon: <Users />, path: '/employees' },
    { title: 'Price List', icon: <ClipboardList />, path: '/pricelist' },
    { title: 'Payments', icon: <CreditCard />, path: '/payments' },
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
    </aside>
  );
};

export default Sidebar;
