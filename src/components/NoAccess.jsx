import React from 'react';
import { Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NoAccess = () => {
  const navigate = useNavigate();

  return (
    <div className="no-access-container">
      <div className="no-access-card">
        <div className="icon-pulse">
          <ShieldAlert size={64} color="#ef4444" />
        </div>
        <h1>Access Denied</h1>
        <p>You don't have access to this section. Ask admin to enable it for your account.</p>
        
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Go Back
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Return to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        .no-access-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 70vh;
          padding: 24px;
        }
        .no-access-card {
          background: white;
          padding: 48px;
          border-radius: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
          border: 1px solid #f1f5f9;
        }
        .icon-pulse {
          width: 120px;
          height: 120px;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        h1 {
          font-size: 28px;
          color: #0f172a;
          margin-bottom: 12px;
          font-weight: 800;
        }
        p {
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
          font-size: 16px;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default NoAccess;
