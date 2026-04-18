import React from 'react';
import { Search, Download, Filter, MoreVertical, CreditCard, Banknote } from 'lucide-react';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const Payments = () => {
  const payments = [
    { txId: 'TXN-98234', from: 'Downtown Grocery', amount: '₹1,250.00', method: 'Bank Transfer', date: 'Apr 18, 2024, 10:30 AM', status: 'Success' },
    { txId: 'TXN-98235', from: 'Fresh Mart', amount: '₹450.25', method: 'Credit Card', date: 'Apr 17, 2024, 02:45 PM', status: 'Success' },
    { txId: 'TXN-98236', from: 'Green Valley', amount: '₹890.00', method: 'Cash', date: 'Apr 17, 2024, 09:12 AM', status: 'Pending' },
    { txId: 'TXN-98237', from: 'Nature Choice', amount: '₹2,100.00', method: 'Bank Transfer', date: 'Apr 16, 2024, 11:20 AM', status: 'Failed' },
  ];

  const getMethodIcon = (method) => {
    switch (method) {
      case 'Credit Card': return <CreditCard size={14} />;
      case 'Bank Transfer': return <Banknote size={14} />;
      default: return <Banknote size={14} />;
    }
  };

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Transactions</span>
          </div>
        </div>
        <button className="btn-primary">
          <Download size={20} />
          Export Report
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search transactions..." 
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
            <button className="mega-menu-btn" style={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>TX ID</th>
                <th>FROM</th>
                <th>AMOUNT</th>
                <th>METHOD</th>
                <th>DATE & TIME</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>{payment.txId}</td>
                  <td>{payment.from}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{payment.amount}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      {getMethodIcon(payment.method)}
                      {payment.method}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{payment.date}</td>
                  <td>
                    <span className={`status-badge status-${payment.status === 'Success' ? 'success' : payment.status === 'Pending' ? 'warning' : 'danger'}`}>
                      {payment.status}
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

export default Payments;
