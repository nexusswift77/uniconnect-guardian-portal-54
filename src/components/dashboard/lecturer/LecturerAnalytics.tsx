import React, { useState, useEffect } from 'react';
import { EnhancedUser, EnhancedCourse } from '@/types/enhanced';
import { CourseService, AttendanceService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Award,
  Activity
} from 'lucide-react';

interface LecturerAnalyticsProps {
  user: EnhancedUser;
}

interface CourseAnalytics {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  attendanceTrend: 'up' | 'down' | 'stable';
  lastSessionDate: string;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
  }>;
  lowPerformers: Array<{
    studentId: string;
    studentName: string;
    attendanceRate: number;
  }>;
  weeklyData: Array<{
    week: string;
    attendanceRate: number;
    sessionsCount: number;
  }>;
}

interface OverallAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalSessions: number;
  overallAttendanceRate: number;
  activeCourses: number;
  thisWeekSessions: number;
  thisWeekAttendance: number;
  monthlyTrend: 'up' | 'down' | 'stable';
}

const LecturerAnalytics: React.FC<LecturerAnalyticsProps> = ({ user }) => {
  const [courses, setCourses] = useState<EnhancedCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [overallAnalytics, setOverallAnalytics] = useState<OverallAnalytics | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('30'); // days

  useEffect(() => {
    loadCourses();
    loadOverallAnalytics();
  }, [user.id, timeRange]);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseAnalytics();
    }
  }, [selectedCourse, timeRange]);

  const loadCourses = async () => {
    try {
      const response = await CourseService.getCoursesByInstructor(user.id, 1, 100);
      setCourses(response.data);
      if (response.data.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadOverallAnalytics = async () => {
    try {
      setLoading(true);
      // This would be a real API call to get lecturer analytics
      // For now, we'll simulate the data
      const mockOverallAnalytics: OverallAnalytics = {
        totalCourses: courses.length,
        totalStudents: courses.reduce((sum, course) => sum + course.maxStudents, 0),
        totalSessions: 45,
        overallAttendanceRate: 87.5,
        activeCourses: courses.length,
        thisWeekSessions: 8,
        thisWeekAttendance: 92.3,
        monthlyTrend: 'up'
      };
      setOverallAnalytics(mockOverallAnalytics);
    } catch (error) {
      console.error('Error loading overall analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseAnalytics = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      const course = courses.find(c => c.id === selectedCourse);
      if (!course) return;

      // This would be a real API call to get course-specific analytics
      // For now, we'll simulate the data
      const mockCourseAnalytics: CourseAnalytics = {
        courseId: selectedCourse,
        courseName: course.name,
        courseCode: course.code,
        totalStudents: course.maxStudents,
        totalSessions: 12,
        averageAttendance: 85.7,
        attendanceTrend: 'up',
        lastSessionDate: new Date().toISOString(),
        topPerformers: [
          { studentId: '1', studentName: 'Alice Johnson', attendanceRate: 98.5 },
          { studentId: '2', studentName: 'Bob Smith', attendanceRate: 96.2 },
          { studentId: '3', studentName: 'Carol Davis', attendanceRate: 94.8 }
        ],
        lowPerformers: [
          { studentId: '4', studentName: 'David Wilson', attendanceRate: 65.3 },
          { studentId: '5', studentName: 'Eva Brown', attendanceRate: 72.1 },
          { studentId: '6', studentName: 'Frank Miller', attendanceRate: 78.9 }
        ],
        weeklyData: [
          { week: 'Week 1', attendanceRate: 82.1, sessionsCount: 3 },
          { week: 'Week 2', attendanceRate: 84.5, sessionsCount: 3 },
          { week: 'Week 3', attendanceRate: 87.2, sessionsCount: 3 },
          { week: 'Week 4', attendanceRate: 89.1, sessionsCount: 3 }
        ]
      };
      setCourseAnalytics(mockCourseAnalytics);
    } catch (error) {
      console.error('Error loading course analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            View insights about your courses and student attendance
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Analytics Cards */}
      {overallAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAnalytics.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                {overallAnalytics.activeCourses} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAnalytics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Across all courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceColor(overallAnalytics.overallAttendanceRate)}`}>
                {formatPercentage(overallAnalytics.overallAttendanceRate)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getTrendIcon(overallAnalytics.monthlyTrend)}
                <span className="ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAnalytics.thisWeekSessions}</div>
              <p className="text-xs text-muted-foreground">
                Sessions conducted
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course-Specific Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Details</TabsTrigger>
            <TabsTrigger value="students">Student Performance</TabsTrigger>
          </TabsList>
          
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="overview" className="space-y-4">
          {courseAnalytics ? (
            <>
              {/* Course Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courseAnalytics.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      In {courseAnalytics.courseCode}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{courseAnalytics.totalSessions}</div>
                    <p className="text-xs text-muted-foreground">
                      Sessions conducted
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getAttendanceColor(courseAnalytics.averageAttendance)}`}>
                      {formatPercentage(courseAnalytics.averageAttendance)}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {getTrendIcon(courseAnalytics.attendanceTrend)}
                      <span className="ml-1">Trending {courseAnalytics.attendanceTrend}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Session</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Date(courseAnalytics.lastSessionDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Latest class
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseAnalytics.weeklyData.map((week, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="font-medium">{week.week}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">
                            {week.sessionsCount} sessions
                          </span>
                          <span className={`font-semibold ${getAttendanceColor(week.attendanceRate)}`}>
                            {formatPercentage(week.attendanceRate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No analytics available</h3>
                <p className="text-muted-foreground">
                  {courses.length === 0 
                    ? "You don't have any courses yet."
                    : "Select a course to view detailed analytics."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          {courseAnalytics ? (
            <div className="grid gap-6">
              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getAttendanceColor(courseAnalytics.averageAttendance)}`}>
                        {formatPercentage(courseAnalytics.averageAttendance)}
                      </div>
                      <p className="text-sm text-muted-foreground">Average Attendance</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round(courseAnalytics.totalStudents * courseAnalytics.averageAttendance / 100)}
                      </div>
                      <p className="text-sm text-muted-foreground">Students Present (avg)</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {courseAnalytics.totalStudents - Math.round(courseAnalytics.totalStudents * courseAnalytics.averageAttendance / 100)}
                      </div>
                      <p className="text-sm text-muted-foreground">Students Absent (avg)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span>Attendance Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div>
                        <p className="font-medium text-yellow-800">Low Attendance Warning</p>
                        <p className="text-sm text-yellow-600">
                          3 students have attendance below 75%
                        </p>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Action Required
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                      <div>
                        <p className="font-medium text-blue-800">Attendance Improvement</p>
                        <p className="text-sm text-blue-600">
                          Overall attendance increased by 5% this month
                        </p>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        Good Progress
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No attendance data</h3>
                <p className="text-muted-foreground">
                  Select a course to view attendance analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {courseAnalytics ? (
            <div className="grid gap-6">
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span>Top Performers</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courseAnalytics.topPerformers.map((student, index) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{student.studentName}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {formatPercentage(student.attendanceRate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Students Needing Attention */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span>Students Needing Attention</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courseAnalytics.lowPerformers.map((student, index) => (
                      <div key={student.studentId} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{student.studentName}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getAttendanceColor(student.attendanceRate)}`}>
                            {formatPercentage(student.attendanceRate)}
                          </div>
                          <Button variant="outline" size="sm" className="mt-1">
                            Contact Student
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No student data</h3>
                <p className="text-muted-foreground">
                  Select a course to view student performance analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LecturerAnalytics;