import React, { useState, useEffect } from 'react';
import { EnhancedUser, SchoolStats, School } from '@/types/enhanced';
import { SchoolService, UserService, ApprovalService, BeaconService, CourseService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Wifi, 
  BookOpen, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  RefreshCw,
  GraduationCap,
  UserCheck,
  Settings,
  LogOut
} from 'lucide-react';

// Import HOD-specific components
import SchoolUserManagement from './hod/SchoolUserManagement';
import SchoolBeaconManagement from './hod/SchoolBeaconManagement';
import SchoolCourseManagement from './hod/SchoolCourseManagement';
import SchoolApprovalsPanel from './hod/SchoolApprovalsPanel';
import SchoolAnalytics from './hod/SchoolAnalytics';

interface HODDashboardProps {
  user: EnhancedUser;
  schoolStats: SchoolStats | null;
  onRefresh: () => void;
}

const HODDashboard: React.FC<HODDashboardProps> = ({
  user,
  schoolStats,
  onRefresh
}) => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'beacons' | 'approvals' | 'analytics'>('overview');
  const [school, setSchool] = useState<School | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchoolData();
  }, [user.schoolId]);

  const loadSchoolData = async () => {
    if (!user.schoolId) return;
    
    try {
      setLoading(true);
      
      // Load school information
      const schoolResponse = await SchoolService.getSchoolById(user.schoolId);
      if (schoolResponse.data) {
        setSchool(schoolResponse.data);
      }

      // Load pending requests for this school
      const approvalsResponse = await ApprovalService.getPendingRequestsBySchool(user.schoolId);
      if (approvalsResponse.data) {
        setPendingRequests(approvalsResponse.data.totalPending);
      }
    } catch (error) {
      console.error('Error loading school data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    onRefresh();
    loadSchoolData();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section with School Info */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-green-100">
              {user.role === 'head_lecturer' ? 'Head of Department' : 'School Administrator'} - {school?.name || 'Loading...'}
            </p>
            {school && (
              <div className="mt-3 flex items-center space-x-4 text-sm">
                <span>School Code: {school.code}</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {school.status}
                </Badge>
              </div>
            )}
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* School Statistics Cards */}
      {schoolStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Enrolled students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lecturers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.totalLecturers}</div>
              <p className="text-xs text-muted-foreground">
                Faculty members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                Active courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setActiveTab('approvals')}
              className="w-full justify-start"
              variant="outline"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Review Student Requests
              {pendingRequests > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingRequests}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('courses')}
              className="w-full justify-start"
              variant="outline"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Courses
            </Button>
            <Button
              onClick={() => setActiveTab('beacons')}
              className="w-full justify-start"
              variant="outline"
            >
              <Wifi className="mr-2 h-4 w-4" />
              Manage BLE Beacons
            </Button>
            <Button
              onClick={() => setActiveTab('users')}
              className="w-full justify-start"
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage School Users
            </Button>
          </CardContent>
        </Card>

        {/* School Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>School Information</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {school ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="text-sm text-muted-foreground">Code: {school.code}</p>
                </div>
                {school.address && (
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{school.address}</p>
                  </div>
                )}
                {school.contactEmail && (
                  <div>
                    <p className="text-sm font-medium">Contact</p>
                    <p className="text-sm text-muted-foreground">{school.contactEmail}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                    {school.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Beacons</span>
                  <span className="text-sm">{schoolStats?.activeBeacons || 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Loading school information...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingRequests} pending student requests that require your approval.
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

  if (!user.schoolId) {
    return (
      <Alert>
        <AlertDescription>
          You are not assigned to a school. Please contact the system administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: CheckCircle },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'beacons', label: 'Beacons', icon: Wifi },
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
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'approvals' && pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingRequests}
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
        {activeTab === 'users' && (
          <SchoolUserManagement user={user} school={school} onUpdate={handleRefresh} />
        )}
        {activeTab === 'courses' && (
          <SchoolCourseManagement user={user} />
        )}
        {activeTab === 'beacons' && (
          <SchoolBeaconManagement user={user} school={school} onUpdate={handleRefresh} />
        )}
        {activeTab === 'approvals' && (
          <SchoolApprovalsPanel user={user} />
        )}
        {activeTab === 'analytics' && (
          <SchoolAnalytics user={user} school={school} schoolStats={schoolStats} />
        )}
      </div>
    </div>
  );
};

export default HODDashboard; 