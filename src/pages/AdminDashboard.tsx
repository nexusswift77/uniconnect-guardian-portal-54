import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import RoleBasedDashboard from '@/components/dashboard/RoleBasedDashboard';

const AdminDashboard: React.FC = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin access
  const hasAdminAccess = userProfile.role === 'system_admin' || 
                        userProfile.role === 'admin' || 
                        userProfile.role === 'head_lecturer' ||
                        userProfile.role === 'lecturer';

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <p className="text-sm text-muted-foreground">
            Your role: {userProfile.role}
          </p>
        </div>
      </div>
    );
  }

  return <RoleBasedDashboard user={userProfile} />;
};

export default AdminDashboard; 