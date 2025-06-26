import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolService, UserService } from '@/services';
import { EnhancedUser, DashboardStats, SchoolStats } from '@/types/enhanced';

// Import role-specific dashboard components
import SystemAdminDashboard from './SystemAdminDashboard';
import HODDashboard from './HODDashboard';
import LecturerDashboard from './LecturerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface RoleBasedDashboardProps {
  user: EnhancedUser;
}

interface NoSchoolAssignedUIProps {
  user: EnhancedUser;
  userType: string;
  contactText: string;
}

interface UnauthorizedAccessUIProps {
  user: EnhancedUser;
}

const NoSchoolAssignedUI: React.FC<NoSchoolAssignedUIProps> = ({ user, userType, contactText }) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-600">School Assignment Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You are not currently assigned to a school.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Please contact the {contactText} to assign you to a school before you can access the dashboard.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Your Role:</span> {userType}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Account:</span> {user.email}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Name:</span> {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UnauthorizedAccessUI: React.FC<UnauthorizedAccessUIProps> = ({ user }) => {
  const { signOut } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <Card className="w-full max-w-md mx-4 border-red-200">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              You don't have permission to access the admin dashboard.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This dashboard is for administrative and teaching staff only. Students should use the mobile app for attendance marking.
            </p>
            <div className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
              <div className="space-y-2">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Your Role:</span> {user.role || 'Unknown'}
                </p>
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Account:</span> {user.email}
                </p>
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Name:</span> {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Auto-logout in {countdown} seconds...</span>
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user.role === 'system_admin') {
        // Load system-wide statistics
        const response = await SchoolService.getDashboardStats();
        if (response.error) {
          setError(response.error);
        } else {
          setDashboardStats(response.data);
        }
      } else if (user.schoolId && (user.role === 'head_lecturer' )) {
        // Load school-specific statistics
        const response = await SchoolService.getSchoolStats(user.schoolId);
        if (response.error) {
          setError(response.error);
        } else {
          setSchoolStats(response.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Render role-specific dashboard
  switch (user.role) {
    case 'system_admin':
      return (
        <SystemAdminDashboard 
          user={user} 
          dashboardStats={dashboardStats}
          onRefresh={loadDashboardData}
        />
      );

    case 'head_lecturer':
      if (!user.schoolId) {
        return <NoSchoolAssignedUI user={user} userType="Head of Department" contactText="system administrator" />;
      }
      return (
        <HODDashboard 
          user={user} 
          schoolStats={schoolStats}
          onRefresh={loadDashboardData}
        />
      );

    case 'lecturer':
      if (!user.schoolId) {
        return <NoSchoolAssignedUI user={user} userType="Lecturer" contactText="your administrator" />;
      }
      return (
        <LecturerDashboard 
          user={user}
          onRefresh={loadDashboardData}
        />
      );

    default:
      return <UnauthorizedAccessUI user={user} />;
  }
};

export default RoleBasedDashboard; 