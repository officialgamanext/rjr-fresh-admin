import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Store, 
  Package, 
  CreditCard,
  Plus
} from 'lucide-react';
import '../css/pages/dashboard.css';
import '../css/components/table.css';

const StatCard = ({ title, value, icon, trend, trendValue, iconBg }) => (
  <div className="card stat-card">
    <div className="stat-icon" style={{ backgroundColor: iconBg }}>
      {icon}
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{title}</div>
    <div className={`stat-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
      {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      <span>{trendValue}% than last month</span>
    </div>
  </div>
);

const Dashboard = () => {
  const recentPayments = [
    { id: '#321456', user: 'Alexandra Della', email: 'alex.della@outlook.com', amount: '$249.99 USD', date: '2023-04-25, 03:42PM', status: 'Success' },
    { id: '#987456', user: 'Nancy Elliot', email: 'nancy.elliot@outlook.com', amount: '$120.50 USD', date: '2023-05-20, 12:23PM', status: 'Pending' },
    { id: '#741258', user: 'Green Cute', email: 'green.cute@outlook.com', amount: '$300.00 USD', date: '2023-01-02, 10:36AM', status: 'Success' },
    { id: '#321456', user: 'Henry Leach', email: 'henry.leach@outlook.com', amount: '$249.99 USD', date: '2023-04-25, 04:22PM', status: 'Failed' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span className="breadcrumb-item active">Dashboard</span>
          </div>
        </div>
        <button className="btn-primary">
          <Plus size={20} />
          New Proposal
        </button>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Total Shops" 
          value="156" 
          icon={<Store color="#3b71fe" />} 
          trend="up" 
          trendValue="12" 
          iconBg="#eff4ff"
        />
        <StatCard 
          title="Total Customers" 
          value="2,345" 
          icon={<Users color="#10b981" />} 
          trend="up" 
          trendValue="8" 
          iconBg="#e6f9f1"
        />
        <StatCard 
          title="Total Items" 
          value="450" 
          icon={<Package color="#f59e0b" />} 
          trend="down" 
          trendValue="3" 
          iconBg="#fff7ed"
        />
        <StatCard 
          title="Total Payments" 
          value="$12,850" 
          icon={<CreditCard color="#ef4444" />} 
          trend="up" 
          trendValue="15" 
          iconBg="#fef2f2"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Payments</h3>
          <button className="mega-menu-btn" style={{ fontSize: '12px' }}>View All</button>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CLIENT</th>
                <th>AMOUNT</th>
                <th>DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>{payment.id}</td>
                  <td>
                    <div className="avatar-info">
                      <div className="avatar" style={{ backgroundColor: '#e2e8f0' }}></div>
                      <div>
                        <span className="info-name">{payment.user}</span>
                        <span className="info-sub">{payment.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{payment.amount}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{payment.date}</td>
                  <td>
                    <span className={`status-badge status-${payment.status.toLowerCase()}`}>
                      {payment.status}
                    </span>
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

export default Dashboard;
