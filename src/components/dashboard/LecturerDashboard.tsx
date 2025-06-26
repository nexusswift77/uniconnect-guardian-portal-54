import React, { useState, useEffect } from 'react';
import { EnhancedUser, EnhancedCourse, CourseEnrollmentRequest } from '@/types/enhanced';
import { CourseService, ApprovalService, AttendanceService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Users, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  UserCheck,
  BarChart3,
  QrCode,
  Wifi
} from 'lucide-react';

// Import lecturer-specific components
import MyCourses from './lecturer/MyCourses';
import CourseEnrollmentRequests from './lecturer/CourseEnrollmentRequests';
import AttendanceManagement from './lecturer/AttendanceManagement';
import LecturerAnalytics from './lecturer/LecturerAnalytics';

interface LecturerDashboardProps {
  user: EnhancedUser;
  onRefresh: () => void;
}

const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  user,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'attendance' | 'requests' | 'analytics'>('overview');
  const [myCourses, setMyCourses] = useState<EnhancedCourse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CourseEnrollmentRequest[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLecturerData();
  }, [user.id]);

  const loadLecturerData = async () => {
    try {
      setLoading(true);
      
      // Load lecturer's courses
      const coursesResponse = await CourseService.getCoursesByInstructor(user.id, 1, 20);
      setMyCourses(coursesResponse.data);

      // Load pending enrollment requests for lecturer's courses
      const courseIds = coursesResponse.data.map(course => course.id);
      let allPendingRequests: CourseEnrollmentRequest[] = [];
      
      for (const courseId of courseIds) {
        const requestsResponse = await ApprovalService.getCourseEnrollmentRequests(1, 20, courseId, undefined, 'pending');
        allPendingRequests = [...allPendingRequests, ...requestsResponse.data];
      }
      setPendingRequests(allPendingRequests);

      // Load today's active sessions
      const sessionsResponse = await AttendanceService.getTodayActiveSessions(user.id);
      setTodayClasses(sessionsResponse || []);

    } catch (error) {
      console.error('Error loading lecturer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    onRefresh();
    loadLecturerData();
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-purple-100">
          Lecturer Dashboard - Manage your courses and track attendance
        </p>
        {user.department && (
          <p className="text-purple-200 text-sm mt-1">
            Department: {user.department}
          </p>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrollment requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myCourses.reduce((total, course) => total + (course.maxStudents || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setActiveTab('attendance')}
              className="w-full justify-start"
              variant="outline"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Manage Attendance
            </Button>
            <Button
              onClick={() => setActiveTab('requests')}
              className="w-full justify-start"
              variant="outline"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Review Enrollment Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingRequests.length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('courses')}
              className="w-full justify-start"
              variant="outline"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Manage My Courses
            </Button>
            <Button
              onClick={() => setActiveTab('analytics')}
              className="w-full justify-start"
              variant="outline"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Schedule</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.length > 0 ? (
                todayClasses.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{session.course?.name || 'Unknown Course'}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.start_time} - {session.end_time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.location || 'No location set'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge 
                        variant={session.qr_code_active ? 'default' : 'secondary'}
                      >
                        {session.qr_code_active ? 'QR Active' : 'QR Inactive'}
                      </Badge>
                      {session.beacon_enabled && (
                        <Badge variant="outline">
                          Beacon Enabled
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">No classes scheduled for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Courses Overview */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.length > 0 ? (
              myCourses.slice(0, 6).map((course) => (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">{course.code}</p>
                      {course.department && (
                        <p className="text-xs text-muted-foreground mt-1">{course.department}</p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {course.maxStudents} max
                    </Badge>
                  </div>
                  {course.location && (
                    <p className="text-xs text-muted-foreground mt-2">📍 {course.location}</p>
                  )}
                  {course.beacon && (
                    <div className="flex items-center mt-2">
                      <Wifi className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">Beacon Assigned</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground mt-2">No courses assigned</p>
              </div>
            )}
          </div>
          {myCourses.length > 6 && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('courses')}
              >
                View All Courses ({myCourses.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingRequests.length} pending enrollment requests that require your approval.
            <Button 
              variant="link" 
              className="p-0 ml-2"
              onClick={() => setActiveTab('requests')}
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
            { id: 'courses', label: 'My Courses', icon: BookOpen },
            { id: 'attendance', label: 'Attendance', icon: QrCode },
            { id: 'requests', label: 'Requests', icon: Clock },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'requests' && pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingRequests.length}
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
        {activeTab === 'courses' && (
          <MyCourses user={user} courses={myCourses} onUpdate={handleRefresh} />
        )}
        {activeTab === 'attendance' && (
          <AttendanceManagement user={user} />
        )}
        {activeTab === 'requests' && (
          <CourseEnrollmentRequests user={user} />
        )}
        {activeTab === 'analytics' && (
          <LecturerAnalytics user={user} />
        )}
      </div>
    </div>
  );
};

export default LecturerDashboard; 