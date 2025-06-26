import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  Plus, 
  Settings, 
  Eye, 
  QrCode,
  Wifi,
  AlertCircle,
  BookOpen,
  Activity,
  BarChart3
} from 'lucide-react';
import { AttendanceService, Course, ClassSession } from '@/services/attendanceService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MyClassesPageProps {
  globalSearchTerm?: string;
}

export const MyClassesPage: React.FC<MyClassesPageProps> = ({ globalSearchTerm = '' }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    session_date: '',
    start_time: '',
    end_time: '',
    location: '',
    session_notes: ''
  });
  
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, [userProfile]);

  const loadCourses = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    try {
      const instructorCourses = await AttendanceService.getInstructorCourses(userProfile.id);
      setCourses(instructorCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourseSessions = async (courseId: string) => {
    try {
      const courseSessions = await AttendanceService.getCourseClassSessions(courseId, 20);
      setSessions(courseSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load class sessions",
        variant: "destructive",
      });
    }
  };

  const handleCreateSession = async () => {
    if (!selectedCourse || !userProfile?.id) return;

    try {
      const sessionData = {
        course_id: selectedCourse.id,
        instructor_id: userProfile.id,
        ...newSessionData
      };

      const newSession = await AttendanceService.createClassSession(sessionData);
      
      if (newSession) {
        toast({
          title: "Session Created",
          description: "New class session has been created successfully",
        });
        
        setIsCreatingSession(false);
        setNewSessionData({
          session_date: '',
          start_time: '',
          end_time: '',
          location: '',
          session_notes: ''
        });
        
        // Reload sessions for the selected course
        await loadCourseSessions(selectedCourse.id);
        
        // Reload courses to update today's session status
        await loadCourses();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create class session",
        variant: "destructive",
      });
    }
  };

  const toggleSessionSetting = async (sessionId: string, setting: 'qr_code_active' | 'beacon_enabled', value: boolean) => {
    try {
      await AttendanceService.updateSessionSettings(sessionId, { [setting]: value });
      
      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, [setting]: value }
          : session
      ));

      toast({
        title: "Settings Updated",
        description: `${setting === 'qr_code_active' ? 'QR Code' : 'Beacon'} ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating session settings:', error);
      toast({
        title: "Error",
        description: "Failed to update session settings",
        variant: "destructive",
      });
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSessionStatusBadge = (session: ClassSession) => {
    const today = new Date().toISOString().split('T')[0];
    const sessionDate = session.session_date;
    
    if (sessionDate === today) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Today</Badge>;
    } else if (sessionDate > today) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Upcoming</Badge>;
    } else {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Past</Badge>;
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(globalSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading your classes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Classes</h1>
          <p className="text-gray-400 mt-2">Manage your courses and class sessions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-sky-blue/20 text-sky-blue border-sky-blue/30">
            {filteredCourses.length} Course{filteredCourses.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="glass-card hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg">{course.code}</CardTitle>
                  <CardDescription className="text-gray-300 mt-1">
                    {course.name}
                  </CardDescription>
                </div>
                {course.todaySession && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Live Today
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Users className="w-4 h-4 text-sky-blue" />
                  <span className="text-sm">{course.studentsEnrolled} Students</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-sky-blue" />
                  <span className={`text-sm font-medium ${getAttendanceRateColor(course.attendanceRate || 0)}`}>
                    {course.attendanceRate || 0}% Attendance
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-gray-300">
                <MapPin className="w-4 h-4 text-sky-blue" />
                <span className="text-sm">{course.location}</span>
              </div>

              {/* Today's Session Info */}
              {course.todaySession && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Today's Session</span>
                  </div>
                  <div className="text-gray-300 text-sm">
                    {formatTime(course.todaySession.start_time)} - {formatTime(course.todaySession.end_time)}
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <QrCode className={`w-4 h-4 ${course.todaySession.qr_code_active ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className="text-xs text-gray-400">QR</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Wifi className={`w-4 h-4 ${course.todaySession.beacon_enabled ? 'text-green-400' : 'text-gray-500'}`} />
                      <span className="text-xs text-gray-400">Beacon</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      onClick={() => {
                        setSelectedCourse(course);
                        loadCourseSessions(course.id);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Sessions
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-charcoal border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white">{selectedCourse?.code} - {selectedCourse?.name}</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Class sessions and attendance management
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-6">
                      {/* Course Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-card p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="w-5 h-5 text-sky-blue" />
                            <span className="text-white font-medium">Students</span>
                          </div>
                          <div className="text-2xl font-bold text-white">{selectedCourse?.studentsEnrolled}</div>
                        </div>
                        
                        <div className="glass-card p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-sky-blue" />
                            <span className="text-white font-medium">Attendance</span>
                          </div>
                          <div className={`text-2xl font-bold ${getAttendanceRateColor(selectedCourse?.attendanceRate || 0)}`}>
                            {selectedCourse?.attendanceRate || 0}%
                          </div>
                        </div>
                        
                        <div className="glass-card p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-5 h-5 text-sky-blue" />
                            <span className="text-white font-medium">Sessions</span>
                          </div>
                          <div className="text-2xl font-bold text-white">{sessions.length}</div>
                        </div>
                      </div>

                      {/* Create Session Button */}
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Class Sessions</h3>
                        <Dialog open={isCreatingSession} onOpenChange={setIsCreatingSession}>
                          <DialogTrigger asChild>
                            <Button className="glass-button">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Session
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-charcoal border-white/10">
                            <DialogHeader>
                              <DialogTitle className="text-white">Create New Session</DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Schedule a new class session for {selectedCourse?.code}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 mt-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-300">Date</Label>
                                  <Input
                                    type="date"
                                    value={newSessionData.session_date}
                                    onChange={(e) => setNewSessionData(prev => ({ ...prev, session_date: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-300">Location</Label>
                                  <Input
                                    value={newSessionData.location}
                                    onChange={(e) => setNewSessionData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Room number or location"
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-300">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={newSessionData.start_time}
                                    onChange={(e) => setNewSessionData(prev => ({ ...prev, start_time: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-300">End Time</Label>
                                  <Input
                                    type="time"
                                    value={newSessionData.end_time}
                                    onChange={(e) => setNewSessionData(prev => ({ ...prev, end_time: e.target.value }))}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-gray-300">Session Notes (Optional)</Label>
                                <Input
                                  value={newSessionData.session_notes}
                                  onChange={(e) => setNewSessionData(prev => ({ ...prev, session_notes: e.target.value }))}
                                  placeholder="Any additional notes for this session"
                                  className="bg-white/5 border-white/10 text-white"
                                />
                              </div>
                              
                              <div className="flex space-x-2 pt-4">
                                <Button 
                                  onClick={handleCreateSession}
                                  className="glass-button flex-1"
                                  disabled={!newSessionData.session_date || !newSessionData.start_time || !newSessionData.end_time || !newSessionData.location}
                                >
                                  Create Session
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => setIsCreatingSession(false)}
                                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Sessions List */}
                      <div className="space-y-3">
                        {sessions.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                            <p>No class sessions found</p>
                            <p className="text-sm">Create your first session to get started</p>
                          </div>
                        ) : (
                          sessions.map((session) => (
                            <div key={session.id} className="glass-card p-4 hover:bg-white/5 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <div className="flex items-center space-x-3">
                                      <span className="text-white font-medium">
                                        {formatDate(session.session_date)}
                                      </span>
                                      {getSessionStatusBadge(session)}
                                    </div>
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                                      <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                                      <span>📍 {session.location}</span>
                                    </div>
                                    {session.session_notes && (
                                      <div className="text-sm text-gray-400 mt-1">
                                        💭 {session.session_notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                  {/* Attendance Info */}
                                  <div className="text-right">
                                    <div className="text-white font-medium">
                                      {session.attendance_count || 0}/{session.total_enrolled || 0}
                                    </div>
                                    <div className="text-xs text-gray-400">Present</div>
                                  </div>
                                  
                                  {/* Session Controls */}
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSessionSetting(session.id, 'qr_code_active', !session.qr_code_active)}
                                      className={`p-2 ${session.qr_code_active 
                                        ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                                        : 'bg-white/5 border-white/10 text-gray-400'}`}
                                    >
                                      <QrCode className="w-4 h-4" />
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSessionSetting(session.id, 'beacon_enabled', !session.beacon_enabled)}
                                      className={`p-2 ${session.beacon_enabled 
                                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                                        : 'bg-white/5 border-white/10 text-gray-400'}`}
                                    >
                                      <Wifi className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-sky-blue/10 border-sky-blue/30 text-sky-blue hover:bg-sky-blue/20"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Students
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-charcoal border-white/10 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Student Enrollment - {course.code}</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        View students enrolled in this course
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card p-4 text-center">
                          <Users className="h-8 w-8 text-sky-blue mx-auto mb-2" />
                          <p className="text-2xl font-bold text-white">{course.studentsEnrolled || 0}</p>
                          <p className="text-gray-400 text-sm">Enrolled Students</p>
                        </div>
                        <div className="glass-card p-4 text-center">
                          <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-white">{course.attendanceRate || 0}%</p>
                          <p className="text-gray-400 text-sm">Avg Attendance</p>
                        </div>
                        <div className="glass-card p-4 text-center">
                          <BarChart3 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-white">
                            {sessions.filter(s => s.session_date <= new Date().toISOString().split('T')[0]).length}
                          </p>
                          <p className="text-gray-400 text-sm">Sessions Held</p>
                        </div>
                      </div>
                      
                      <Alert className="bg-blue-500/10 border-blue-500/20">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-400">
                          To manage student enrollments (add/remove students), please use the Course Management section in the admin panel or contact your head of department.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="text-center py-4">
                        <p className="text-gray-400 mb-2">Need to manage enrollments?</p>
                        <p className="text-gray-500 text-sm">
                          Student enrollment is handled through the Course Management system by administrators.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Classes Found</h3>
          <p className="text-gray-400 mb-6">
            {globalSearchTerm 
              ? `No classes match "${globalSearchTerm}"`
              : "You don't have any courses assigned yet"
            }
          </p>
          {!globalSearchTerm && (
            <Alert className="max-w-md mx-auto bg-blue-500/10 border-blue-500/20">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                Contact your administrator to get courses assigned to your account.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}; 