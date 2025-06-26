import React, { useState, useEffect } from 'react';
import { EnhancedUser, EnhancedCourse, EnhancedClassSession, EnhancedAttendanceRecord } from '@/types/enhanced';
import { CourseService, AttendanceService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Square, 
  QrCode, 
  Wifi, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Search,
  Download,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';

interface AttendanceManagementProps {
  user: EnhancedUser;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ user }) => {
  const [courses, setCourses] = useState<EnhancedCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [sessions, setSessions] = useState<EnhancedClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<EnhancedAttendanceRecord[]>([]);
  const [activeSessions, setActiveSessions] = useState<EnhancedClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<EnhancedClassSession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  useEffect(() => {
    loadCourses();
    loadActiveSessions();
  }, [user.id]);

  useEffect(() => {
    if (selectedCourse) {
      loadSessions();
    }
  }, [selectedCourse, dateFilter]);

  useEffect(() => {
    if (selectedSession) {
      loadAttendanceRecords();
    }
  }, [selectedSession]);

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

  const loadActiveSessions = async () => {
    try {
      const sessions = await AttendanceService.getTodayActiveSessions(user.id);
      setActiveSessions(sessions || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const loadSessions = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      const sessions = await AttendanceService.getCourseClassSessions(selectedCourse, 50);
      setSessions(sessions as unknown as EnhancedClassSession[]);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!selectedSession) return;
    
    try {
      const response = await AttendanceService.getSessionAttendance(selectedSession.id);
      setAttendanceRecords(response.data || []);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  const handleStartSession = async (courseId: string) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      const sessionData = {
        courseId,
        instructorId: user.id,
        startTime: new Date().toTimeString().split(' ')[0],
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toTimeString().split(' ')[0], // 2 hours later
        location: course.location || '',
        qrCodeActive: true,
        beaconEnabled: !!course.beaconId,
        attendanceWindowMinutes: 15
      };

      await AttendanceService.startClassSession(sessionData);
      loadActiveSessions();
      loadSessions();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await AttendanceService.endClassSession(sessionId);
      loadActiveSessions();
      loadSessions();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleToggleQR = async (sessionId: string, active: boolean) => {
    try {
      await AttendanceService.toggleQRCode(sessionId, active);
      loadActiveSessions();
      loadSessions();
    } catch (error) {
      console.error('Error toggling QR code:', error);
    }
  };

  const handleManualAttendance = async (sessionId: string, studentId: string, status: 'verified' | 'absent') => {
    try {
      await AttendanceService.markAttendance(sessionId, studentId, status);
      loadAttendanceRecords();
    } catch (error) {
      console.error('Error marking manual attendance:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Present</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>;
      case 'late':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Late</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-blue-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAttendanceRecords = attendanceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const selectedCourseData = courses.find(course => course.id === selectedCourse);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Management</h2>
          <p className="text-muted-foreground">
            Manage class sessions and track student attendance
          </p>
        </div>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-green-600" />
              <span>Active Sessions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="font-semibold">{session.course?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.course?.code} • {session.location} • Started: {formatTime(session.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleQR(session.id, !session.qrCodeActive)}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      {session.qrCodeActive ? 'Disable QR' : 'Enable QR'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session);
                        setShowSessionDialog(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEndSession(session.id)}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      End Session
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Selection and Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
              <Label htmlFor="course-select">Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
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
            
            <div className="min-w-[150px]">
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            <Button
              onClick={() => selectedCourse && handleStartSession(selectedCourse)}
              disabled={!selectedCourse || activeSessions.some(s => s.courseId === selectedCourse)}
            >
              <Play className="mr-2 h-4 w-4" />
              Start New Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Info */}
      {selectedCourseData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedCourseData.code} - {selectedCourseData.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    Max {selectedCourseData.maxStudents} students
                  </span>
                  {selectedCourseData.location && (
                    <span className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {selectedCourseData.location}
                    </span>
                  )}
                  {selectedCourseData.beacon && (
                    <span className="flex items-center">
                      <Wifi className="mr-1 h-4 w-4" />
                      {selectedCourseData.beacon.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Class Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
              <p className="text-muted-foreground">
                {selectedCourse 
                  ? "No sessions have been created for this course yet."
                  : "Please select a course to view sessions."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-muted rounded">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{formatDate(session.sessionDate)}</span>
                        <Badge variant="outline">{session.sessionType}</Badge>
                        {session.qrCodeActive && <Badge variant="secondary">QR Active</Badge>}
                        {session.beaconEnabled && <Badge variant="secondary">Beacon Enabled</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : 'In Progress'}
                        {session.location && ` • ${session.location}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session);
                        setShowSessionDialog(true);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Attendance
                    </Button>
                    {!session.endTime && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEndSession(session.id)}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        End Session
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Attendance Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Session Attendance - {selectedSession?.course?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(selectedSession.sessionDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {formatTime(selectedSession.startTime)} - {selectedSession.endTime ? formatTime(selectedSession.endTime) : 'In Progress'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedSession.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance</p>
                      <p className="font-medium">
                        {attendanceRecords.filter(r => r.status === 'verified').length} / {attendanceRecords.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="verified">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Attendance Records */}
              <div className="space-y-4">
                {filteredAttendanceRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No attendance records found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all'
                        ? "No records match your current filters."
                        : "No students have checked in yet."}
                    </p>
                  </div>
                ) : (
                  filteredAttendanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">
                            {record.student?.firstName} {record.student?.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {record.student?.email} • {record.student?.studentId}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusBadge(record.status)}
                            <Badge variant="outline">{record.method}</Badge>
                          </div>
                          {record.checkInTime && (
                            <p className="text-sm text-muted-foreground">
                              Checked in: {formatTime(record.checkInTime)}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualAttendance(selectedSession.id, record.student?.id || '', 'verified')}
                            disabled={record.status === 'verified'}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualAttendance(selectedSession.id, record.student?.id || '', 'absent')}
                            disabled={record.status === 'absent'}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceManagement;