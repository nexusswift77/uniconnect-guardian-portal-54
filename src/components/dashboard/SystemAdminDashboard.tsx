import React, { useState, useEffect } from 'react';
import { EnhancedUser, DashboardStats, School, PaginatedResponse } from '@/types/enhanced';
import { SchoolService, UserService, ApprovalService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  School as SchoolIcon, 
  Users, 
  Wifi, 
  BookOpen, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

// Import sub-components
import SchoolManagementPanel from './system-admin/SchoolManagementPanel';
import SystemUserManagement from './system-admin/SystemUserManagement';
import PendingApprovalsPanel from './system-admin/PendingApprovalsPanel';
import SystemAnalytics from './system-admin/SystemAnalytics';

interface SystemAdminDashboardProps {
  user: EnhancedUser;
  dashboardStats: DashboardStats | null;
  onRefresh: () => void;
}

const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({
  user,
  dashboardStats,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'users' | 'approvals' | 'analytics'>('overview');
  const [recentSchools, setRecentSchools] = useState<School[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentData();
  }, []);

  const loadRecentData = async () => {
    try {
      setLoading(true);
      
      // Load recent schools
      const schoolsResponse = await SchoolService.getAllSchools(1, 5);
      setRecentSchools(schoolsResponse.data);

      // Load pending approvals count
      const approvalsResponse = await ApprovalService.getApprovalStats();
      if (approvalsResponse.data) {
        setPendingApprovals(approvalsResponse.data.totalPending);
      }
    } catch (error) {
      console.error('Error loading recent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    onRefresh();
    loadRecentData();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-blue-100">
          System Administrator Dashboard - Manage all schools and system-wide settings
        </p>
      </div>

      {/* Statistics Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
              <SchoolIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalSchools}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.activeSchools} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.pendingApprovals} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BLE Beacons</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalBeacons}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.activeBeacons} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.todayAttendance} attendance today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setActiveTab('schools')}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New School
            </Button>
            <Button
              onClick={() => setActiveTab('approvals')}
              className="w-full justify-start"
              variant="outline"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Review Pending Approvals
              {pendingApprovals > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingApprovals}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('users')}
              className="w-full justify-start"
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage System Users
            </Button>
          </CardContent>
        </Card>

        {/* Recent Schools */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Schools</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSchools.length > 0 ? (
                recentSchools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <p className="text-sm text-muted-foreground">{school.code}</p>
                    </div>
                    <Badge 
                      variant={school.status === 'active' ? 'default' : 'secondary'}
                    >
                      {school.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No schools found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {dashboardStats && dashboardStats.pendingApprovals > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {dashboardStats.pendingApprovals} pending user approvals that require attention.
            <Button 
              variant="link" 
              className="p-0 ml-2"
              onClick={() => setActiveTab('approvals')}
            >
              Review now
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: CheckCircle },
            { id: 'schools', label: 'Schools', icon: SchoolIcon },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'approvals', label: 'Approvals', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'approvals' && pendingApprovals > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingApprovals}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'schools' && (
          <SchoolManagementPanel user={user} onUpdate={handleRefresh} />
        )}
        {activeTab === 'users' && (
          <SystemUserManagement user={user} onUpdate={handleRefresh} />
        )}
        {activeTab === 'approvals' && (
          <PendingApprovalsPanel user={user} onUpdate={handleRefresh} />
        )}
        {activeTab === 'analytics' && (
          <SystemAnalytics user={user} dashboardStats={dashboardStats} />
        )}
      </div>
    </div>
  );
};

export default SystemAdminDashboard; 