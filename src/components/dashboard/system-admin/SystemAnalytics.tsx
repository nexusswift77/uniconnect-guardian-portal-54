import React from 'react';
import { EnhancedUser, DashboardStats } from '@/types/enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, School as SchoolIcon } from 'lucide-react';

interface SystemAnalyticsProps {
  user: EnhancedUser;
  dashboardStats: DashboardStats | null;
}

const SystemAnalytics: React.FC<SystemAnalyticsProps> = ({ user, dashboardStats }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Analytics</h2>
        <p className="text-muted-foreground">System-wide performance and usage analytics</p>
      </div>

      {dashboardStats ? (
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
              <CardTitle className="text-sm font-medium">System Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.todayAttendance}</div>
              <p className="text-xs text-muted-foreground">
                Attendance records today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((dashboardStats.activeBeacons / Math.max(dashboardStats.totalBeacons, 1)) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Beacons online
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Analytics Loading</h3>
              <p className="text-muted-foreground">System analytics data is being loaded...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center py-8">
        <Badge variant="outline">More detailed analytics coming soon</Badge>
      </div>
    </div>
  );
};

export default SystemAnalytics; 