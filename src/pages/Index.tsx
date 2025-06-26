import React, { useEffect } from 'react';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RoleBasedDashboard from '@/components/dashboard/RoleBasedDashboard';

const Index = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and has a profile, show their role-based dashboard
    if (userProfile && !loading) {
      // Check if user has admin access (any role that can access the dashboard)
      const hasAdminAccess = userProfile.role === 'system_admin' || 
                            userProfile.role === 'admin' || 
                            userProfile.role === 'head_lecturer' ||
                            userProfile.role === 'lecturer';
      
      if (hasAdminAccess) {
        // User can access dashboard, show it directly on the index page
        return;
      } else {
        // User doesn't have admin access, show access denied
        return;
      }
    }
  }, [userProfile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login/signup forms
  if (!userProfile) {
    return <AuthWrapper />;
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
          <p className="text-xs text-muted-foreground mt-2">
            Students should use the mobile app for attendance marking.
          </p>
        </div>
      </div>
    );
  }

  // Show the role-based dashboard for authenticated users with admin access
  return <RoleBasedDashboard user={userProfile} />;
};

export default Index; 