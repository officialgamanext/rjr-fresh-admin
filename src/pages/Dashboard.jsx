import React from 'react';
import '../css/Dashboard.css';
import { MoreVertical, Filter, Search as SearchIcon } from 'lucide-react';

const Dashboard = () => {
  const proposals = [
    { id: '#321456', client: 'Alexandra Della', email: 'alex.della@outlook.com', subject: 'A business proposal for a new product or service', amount: '₹249.99', date: '2023-04-25, 03:42PM', status: 'Sent', avatar: 'https://i.pravatar.cc/150?u=alex' },
    { id: '#987456', client: 'Nancy Elliot', email: 'nancy.elliot@outlook.com', subject: 'A funding proposal for a non-profit organization', amount: '₹120.50', date: '2023-05-20, 12:23PM', status: 'Open', avatar: 'https://i.pravatar.cc/150?u=nancy' },
    { id: '#741258', client: 'Green Cute', email: 'green.cute@outlook.com', subject: 'A research proposal for a scientific study', amount: '₹300.00', date: '2023-01-02, 10:36AM', status: 'Sent', avatar: 'https://i.pravatar.cc/150?u=green' },
    { id: '#321456', client: 'Henry Leach', email: 'henry.leach@outlook.com', subject: 'A marketing proposal for a new marketing campaign', amount: '₹249.99', date: '2023-04-25, 04:22PM', status: 'Draft', avatar: 'https://i.pravatar.cc/150?u=henry' },
    { id: '#357895', client: 'Marianne Audrey', email: 'marine.adrey@outlook.com', subject: 'A project proposal for a new construction project', amount: '₹150.00', date: '2023-02-15, 05:23PM', status: 'Sent', avatar: 'https://i.pravatar.cc/150?u=mari' },
    { id: '#321456', client: 'Alexandra Della', email: 'alex.della@outlook.com', subject: 'A educational proposal for a new course or program', amount: '₹249.99', date: '2023-04-25, 11:43AM', status: 'Paid', avatar: 'https://i.pravatar.cc/150?u=alex2' },
  ];

  return (
    <div className="page-wrapper">
      <div className="dashboard-container">
        <div className="table-card">
          <div className="table-header">
            <div className="header-left">
              <span>Show</span>
              <select className="entries-select">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="header-right">
              <div className="search-box">
                <span>Search:</span>
                <input type="text" className="search-input" />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th><input type="checkbox" /></th>
                  <th>PROPOSAL</th>
                  <th>CLIENT</th>
                  <th>SUBJECT</th>
                  <th>AMOUNT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td><input type="checkbox" /></td>
                    <td className="proposal-id">{row.id}</td>
                    <td className="client-info">
                      <img src={row.avatar} alt="" className="client-avatar" />
                      <div className="client-details">
                        <span className="client-name">{row.client}</span>
                        <span className="client-email">{row.email}</span>
                      </div>
                    </td>
                    <td className="subject-text">{row.subject}</td>
                    <td className="amount-text">{row.amount}</td>
                    <td className="date-text">{row.date}</td>
                    <td>
                      <span className={`status-badge ${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-more">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
