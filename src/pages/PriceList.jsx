import React from 'react';
import { Plus, Search, FileText, Download, MoreVertical } from 'lucide-react';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const PriceList = () => {
  const priceLists = [
    { title: 'Standard Summer Price List', category: 'Retail', items: 45, lastUpdated: 'Apr 10, 2024', status: 'Active' },
    { title: 'Wholesale Special B2B', category: 'Wholesale', items: 120, lastUpdated: 'Mar 15, 2024', status: 'Active' },
    { title: 'Promotional Autumn', category: 'Discount', items: 30, lastUpdated: 'Apr 01, 2024', status: 'Draft' },
    { title: 'Premium Shop Exclusive', category: 'Premium', items: 15, lastUpdated: 'Feb 20, 2024', status: 'Expired' },
  ];

  return (
    <div className="pricelist-page">
      <div className="page-header">
        <div>
          <h1>Price Lists</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Price Lists Management</span>
          </div>
        </div>
        <button className="btn-primary">
          <Plus size={20} />
          Create Price List
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Price Lists</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="mega-menu-btn" style={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>TITLE</th>
                <th>CATEGORY</th>
                <th>NO. OF ITEMS</th>
                <th>LAST UPDATED</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {priceLists.map((list, index) => (
                <tr key={index}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600 }}>{list.title}</span>
                    </div>
                  </td>
                  <td>{list.category}</td>
                  <td>{list.items} Items</td>
                  <td>{list.lastUpdated}</td>
                  <td>
                    <span className={`status-badge status-${list.status === 'Active' ? 'success' : list.status === 'Draft' ? 'warning' : 'danger'}`}>
                      {list.status}
                    </span>
                  </td>
                  <td>
                    <button><MoreVertical size={16} color="var(--text-muted)" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PriceList;
