import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import NoAccess from './NoAccess';
import { Loader2 } from 'lucide-react';

const PermissionGate = ({ children, permission }) => {
  const { userData, currentUser } = useAuth();

  // Show nothing if still loading auth state
  if (!currentUser) return null;

  // Wait for userData to load
  if (!userData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  // Super admins have access to everything
  if (userData.isSuperAdmin) return children;

  // Check specific permission
  if (userData.access?.admin?.[permission]) {
    return children;
  }

  return <NoAccess />;
};

export default PermissionGate;
