import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../css/variables.css';

const Layout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
        }
        .main-content {
          flex: 1;
          margin-left: var(--sidebar-width);
          padding-top: var(--topbar-height);
        }
        .page-content {
          padding: 24px;
        }
      `}</style>
    </div>
  );
};

export default Layout;
