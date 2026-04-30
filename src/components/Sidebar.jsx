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
  Box,
  RefreshCw,
  MapPin
} from 'lucide-react';
import '../css/components/sidebar.css';

import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { userData } = useAuth();
  
  const navItems = [
    { title: 'Dashboard', icon: <LayoutDashboard />, path: '/', key: 'dashboard' },
    { title: 'Shops', icon: <Store />, path: '/shops', key: 'shops' },
    { title: 'Shop Visits', icon: <MapPin />, path: '/shop-visits', key: 'shopVisits' },
    { title: 'Shop Orders', icon: <Package />, path: '/shop-orders', key: 'shopOrders' },
    { title: 'Return Orders', icon: <RefreshCw />, path: '/return-orders', key: 'returnOrders' },
    { title: 'Payments', icon: <CreditCard />, path: '/payments', key: 'payments' },
    { title: 'Customers', icon: <Users />, path: '/customers', key: 'customers' },
    { title: 'Customer Orders', icon: <Package />, path: '/customer-orders', key: 'customerOrders' },
    { title: 'Customer Prices', icon: <Tag />, path: '/customer-prices', key: 'customerPrices' },
    { title: 'Batches', icon: <Box />, path: '/batches', key: 'batches' },
    { title: 'Items', icon: <Package />, path: '/items', key: 'items' },
    { title: 'Item Categories', icon: <Layers />, path: '/categories', key: 'categories' },
    { title: 'Price List', icon: <ClipboardList />, path: '/pricelist', key: 'priceList' },
    { title: 'Employees', icon: <Users />, path: '/employees', key: 'employees' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (userData?.isSuperAdmin) return true;
    return userData?.access?.admin?.[item.key];
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        RJR FRESH
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <h3 className="section-title">Navigation</h3>
          <ul className="nav-list">
            {filteredNavItems.map((item) => (
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
