import React from 'react';
import { Plus, Search, Mail, Phone, MoreVertical } from 'lucide-react';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const Customers = () => {
  const customers = [
    { name: 'Alexandra Della', email: 'alex.della@outlook.com', phone: '+1 234 567 890', joined: 'Oct 24, 2023', status: 'Active' },
    { name: 'Nancy Elliot', email: 'nancy.elliot@outlook.com', phone: '+1 234 567 891', joined: 'Nov 12, 2023', status: 'Active' },
    { name: 'Green Cute', email: 'green.cute@outlook.com', phone: '+1 234 567 892', joined: 'Dec 05, 2023', status: 'Inactive' },
    { name: 'Henry Leach', email: 'henry.leach@outlook.com', phone: '+1 234 567 893', joined: 'Jan 15, 2024', status: 'Active' },
  ];

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Customer List</span>
          </div>
        </div>
        <button className="btn-primary">
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search customers..." 
              style={{ 
                padding: '8px 12px 8px 36px', 
                borderRadius: '6px', 
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                width: '300px'
              }} 
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>CONTACT</th>
                <th>JOINED DATE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index}>
                  <td>
                    <div className="avatar-info">
                      <div className="avatar" style={{ backgroundColor: '#f1f5f9' }}></div>
                      <div>
                        <span className="info-name">{customer.name}</span>
                        <span className="info-sub">{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Mail size={12} color="var(--text-muted)" /> {customer.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Phone size={12} color="var(--text-muted)" /> {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td>{customer.joined}</td>
                  <td>
                    <span className={`status-badge status-${customer.status === 'Active' ? 'success' : 'danger'}`}>
                      {customer.status}
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

export default Customers;
