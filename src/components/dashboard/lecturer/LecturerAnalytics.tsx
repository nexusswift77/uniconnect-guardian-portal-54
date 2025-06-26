import React, { useState, useEffect } from 'react';
import { EnhancedUser, EnhancedCourse } from '@/types/enhanced';
import { CourseService, AttendanceService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Calendar,
  BookOpen,
  TrendingUp,
  Clock
} from 'lucide-react';

interface LecturerAnalyticsProps {
  user: EnhancedUser;
}

interface SimpleCourseStats {
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  recentAttendanceTrend: Array<{
    date: string;
    present: number;
    total: number;
    rate: number;
  }>;
}

interface OverallStats {
  totalCourses: number;
  totalStudentsAcrossAllCourses: number;
  totalSessionsThisWeek: number;
  averageAttendanceAcrossAllCourses: number;
}

const LecturerAnalytics: React.FC<LecturerAnalyticsProps> = ({ user }) => {
  const [courses, setCourses] = useState<EnhancedCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [courseStats, setCourseStats] = useState<SimpleCourseStats | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseStats();
    }
  }, [selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load courses
      const response = await CourseService.getCoursesByInstructor(user.id, 1, 100);
      setCourses(response.data);
      
      if (response.data.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data[0].id);
      }

      // Calculate overall stats
      const totalCourses = response.data.length;
      const totalStudentsAcrossAllCourses = response.data.reduce((sum, course) => sum + (course.maxStudents || 0), 0);
      
      // Get sessions for this week across all courses
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      let totalSessionsThisWeek = 0;
      let totalAttendanceSum = 0;
      let courseCount = 0;

      for (const course of response.data) {
        const sessions = await AttendanceService.getCourseClassSessions(course.id, 50);
        const thisWeekSessions = sessions.filter(session => 
          new Date(session.session_date) >= oneWeekAgo
        );
        totalSessionsThisWeek += thisWeekSessions.length;

        // Get attendance rate for this course
        const analytics = await AttendanceService.getCourseAttendanceAnalytics(course.id, 30);
        if (analytics.length > 0) {
          const avgRate = analytics.reduce((sum, a) => sum + a.attendanceRate, 0) / analytics.length;
          totalAttendanceSum += avgRate;
          courseCount++;
        }
      }

      const averageAttendanceAcrossAllCourses = courseCount > 0 ? totalAttendanceSum / courseCount : 0;

      setOverallStats({
        totalCourses,
        totalStudentsAcrossAllCourses,
        totalSessionsThisWeek,
        averageAttendanceAcrossAllCourses
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseStats = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      
      // Get real course statistics
      const stats = await AttendanceService.getCourseStatistics(selectedCourse);
      setCourseStats(stats);

    } catch (error) {
      console.error('Error loading course stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !overallStats && !courseStats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <p className="text-gray-400">Overview of your courses and attendance</p>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">My Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overallStats.totalCourses}</div>
              <p className="text-xs text-gray-400">Total assigned</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Students</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overallStats.totalStudentsAcrossAllCourses}</div>
              <p className="text-xs text-gray-400">Across all courses</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overallStats.totalSessionsThisWeek}</div>
              <p className="text-xs text-gray-400">Sessions conducted</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Avg Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceColor(overallStats.averageAttendanceAcrossAllCourses)}`}>
                {formatPercentage(overallStats.averageAttendanceAcrossAllCourses)}
              </div>
              <p className="text-xs text-gray-400">All courses</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Selection */}
      {courses.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Course Details</h3>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[300px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id} className="text-white hover:bg-gray-700">
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Course-Specific Stats */}
      {courseStats && selectedCourse && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Enrolled Students</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{courseStats.totalStudents}</div>
              <p className="text-xs text-gray-400">In this course</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{courseStats.totalSessions}</div>
              <p className="text-xs text-gray-400">Sessions held</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceColor(courseStats.averageAttendance)}`}>
                {formatPercentage(courseStats.averageAttendance)}
              </div>
              <p className="text-xs text-gray-400">Average attendance</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Sessions */}
      {courseStats && courseStats.recentAttendanceTrend.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courseStats.recentAttendanceTrend.slice(0, 5).map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-white font-medium">
                      {new Date(session.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">
                      {session.present}/{session.total} students
                    </span>
                    <Badge 
                      variant={session.rate >= 90 ? 'default' : session.rate >= 75 ? 'secondary' : 'destructive'}
                      className={
                        session.rate >= 90 ? 'bg-green-600 text-white' :
                        session.rate >= 75 ? 'bg-yellow-600 text-white' :
                        'bg-red-600 text-white'
                      }
                    >
                      {formatPercentage(session.rate)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {courses.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">No courses assigned</h3>
            <p className="text-gray-400">You don't have any courses assigned yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LecturerAnalytics;