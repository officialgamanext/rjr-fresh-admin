import React from 'react';
import { Plus, Search, Tag, MoreVertical } from 'lucide-react';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const Items = () => {
  const items = [
    { code: 'ITM-001', name: 'Fresh Tomatoes', category: 'Vegetables', price: '$2.50', stock: '120 kg', status: 'In Stock' },
    { code: 'ITM-002', name: 'Red Apples', category: 'Fruits', price: '$3.00', stock: '85 kg', status: 'In Stock' },
    { code: 'ITM-003', name: 'Organic Honey', category: 'Sweetener', price: '$12.00', stock: '15 units', status: 'Low Stock' },
    { code: 'ITM-004', name: 'Brown Rice', category: 'Grains', price: '$5.50', stock: '0 kg', status: 'Out of Stock' },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'In Stock': return 'success';
      case 'Low Stock': return 'warning';
      case 'Out of Stock': return 'danger';
      default: return 'muted';
    }
  };

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Items Inventory</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Items List</span>
          </div>
        </div>
        <button className="btn-primary">
          <Plus size={20} />
          Add Item
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search items..." 
                style={{ 
                  padding: '8px 12px 8px 36px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  width: '280px'
                }} 
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>CODE</th>
                <th>ITEM NAME</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>{item.code}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={16} color="var(--primary-color)" />
                      {item.name}
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.price}</td>
                  <td>{item.stock}</td>
                  <td>
                    <span className={`status-badge status-${getStatusClass(item.status)}`}>
                      {item.status}
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

export default Items;
