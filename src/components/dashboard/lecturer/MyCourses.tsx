import React, { useState, useEffect } from 'react';
import { EnhancedUser, EnhancedCourse, EnhancedClassSession, BLEBeacon } from '@/types/enhanced';
import { CourseService, AttendanceService, BeaconService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  BookOpen, 
  Users, 
  Wifi, 
  QrCode, 
  Calendar, 
  MapPin,
  Clock,
  Settings,
  Play,
  Square,
  Battery,
  Signal,
  Loader2
} from 'lucide-react';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';

interface MyCoursesProps {
  user: EnhancedUser;
  courses: EnhancedCourse[];
  onUpdate: () => void;
}

const MyCourses: React.FC<MyCoursesProps> = ({ user, courses, onUpdate }) => {
  const [selectedCourse, setSelectedCourse] = useState<EnhancedCourse | null>(null);
  const [activeSessions, setActiveSessions] = useState<EnhancedClassSession[]>([]);
  const [availableBeacons, setAvailableBeacons] = useState<BLEBeacon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);

  // Session form state
  const [sessionForm, setSessionForm] = useState({
    startTime: '',
    endTime: '',
    location: '',
    qrCodeActive: true,
    beaconEnabled: false,
    attendanceWindowMinutes: 5
  });

  useEffect(() => {
    loadActiveSessions();
    loadAvailableBeacons();
  }, []);

  const loadActiveSessions = async () => {
    try {
      const sessions = await AttendanceService.getTodayActiveSessions(user.id);
      setActiveSessions(sessions || []);
    } catch (err) {
      console.error('Error loading active sessions:', err);
    }
  };

  const loadAvailableBeacons = async () => {
    if (!user.schoolId) return;
    
    try {
      const response = await BeaconService.getAvailableBeacons(user.schoolId);
      setAvailableBeacons(response.data);
    } catch (err) {
      console.error('Error loading available beacons:', err);
    }
  };

  const handleStartSession = async (course: EnhancedCourse) => {
    try {
      setLoading(true);
      setError(null);

      const sessionData = {
        courseId: course.id,
        instructorId: user.id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours default
        location: sessionForm.location || course.location,
        qrCodeActive: sessionForm.qrCodeActive,
        beaconEnabled: sessionForm.beaconEnabled && !!course.beacon,
        attendanceWindowMinutes: sessionForm.attendanceWindowMinutes
      };

      const response = await AttendanceService.startClassSession(sessionData);
      if (response.error) {
        setError(response.error);
      } else {
        loadActiveSessions();
        setIsSessionDialogOpen(false);
        resetSessionForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await AttendanceService.endClassSession(sessionId);
      if (response.error) {
        setError(response.error);
      } else {
        loadActiveSessions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQR = async (sessionId: string, active: boolean) => {
    try {
      const response = await AttendanceService.toggleQRCode(sessionId, active);
      if (response.error) {
        setError(response.error);
      } else {
        loadActiveSessions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle QR code');
    }
  };

  const resetSessionForm = () => {
    setSessionForm({
      startTime: '',
      endTime: '',
      location: '',
      qrCodeActive: true,
      beaconEnabled: false,
      attendanceWindowMinutes: 5
    });
  };

  const openSessionDialog = (course: EnhancedCourse) => {
    setSelectedCourse(course);
    setSessionForm({
      ...sessionForm,
      location: course.location || '',
      beaconEnabled: !!course.beacon
    });
    setIsSessionDialogOpen(true);
  };

  const getBeaconStatus = (beacon: BLEBeacon | undefined) => {
    if (!beacon) return null;
    
    return {
      battery: beacon.batteryLevel || 0,
      signal: beacon.signalStrength || 0,
      status: beacon.status
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Courses</h2>
          <p className="text-muted-foreground">Manage your assigned courses and class sessions</p>
        </div>
      </div>

      {/* Active Sessions Alert */}
      {activeSessions.length > 0 && (
        <Alert>
          <Play className="h-4 w-4" />
          <AlertDescription>
            You have {activeSessions.length} active class session(s) running.
          </AlertDescription>
        </Alert>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => {
          const activeSession = activeSessions.find(s => s.courseId === course.id);
          const beaconStatus = getBeaconStatus(course.beacon);
          
          return (
            <Card key={course.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-400 bg-gray-800 border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-white mb-1">{course.name}</CardTitle>
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="secondary" className="font-medium bg-gray-700 text-gray-200 border-gray-600">
                        {course.code}
                      </Badge>
                      {course.department && (
                        <span className="text-sm text-gray-400">{course.department}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {activeSession && (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                        <Play className="mr-1 h-3 w-3" />
                        Live Session
                      </Badge>
                    )}
                    {course.beacon && (
                      <Badge variant="outline" className="border-blue-400 text-blue-300 bg-blue-900/30">
                        <Wifi className="mr-1 h-3 w-3" />
                        Beacon Enabled
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-5">
                {/* Course Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">
                      <span className="font-medium text-white">Max Students:</span> {course.maxStudents}
                    </span>
                  </div>
                  {course.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium text-gray-300">{course.location}</span>
                    </div>
                  )}
                  {course.semester && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-gray-300">
                        <span className="font-medium text-white">Semester:</span> {course.semester}
                      </span>
                    </div>
                  )}
                  {course.academicYear && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-gray-300">
                        <span className="font-medium text-white">Year:</span> {course.academicYear}
                      </span>
                    </div>
                  )}
                </div>

                {/* Beacon Status */}
                {beaconStatus && (
                  <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-blue-600/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Wifi className="h-4 w-4 text-blue-400" />
                        <span className="font-semibold text-white">Beacon Status</span>
                      </div>
                      <Badge 
                        variant={beaconStatus.status === 'active' ? 'default' : 'secondary'}
                        className={beaconStatus.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}
                      >
                        {beaconStatus.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Battery className={`h-4 w-4 ${beaconStatus.battery > 50 ? 'text-green-400' : beaconStatus.battery > 20 ? 'text-yellow-400' : 'text-red-400'}`} />
                        <span className="text-sm font-medium text-gray-300">
                          Battery: {beaconStatus.battery}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Signal className={`h-4 w-4 ${beaconStatus.signal > -50 ? 'text-green-400' : beaconStatus.signal > -70 ? 'text-yellow-400' : 'text-red-400'}`} />
                        <span className="text-sm font-medium text-gray-300">
                          Signal: {beaconStatus.signal}dBm
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Session Info */}
                {activeSession && (
                  <div className="p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-lg border-2 border-green-500/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                          <p className="font-bold text-green-300 text-lg">Live Session Active</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-green-200">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Started: {new Date(activeSession.startTime).toLocaleTimeString()}
                            </span>
                          </div>
                          {activeSession.location && (
                            <div className="flex items-center space-x-2 text-green-200">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm font-medium">{activeSession.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleQR(activeSession.id, !activeSession.qrCodeActive)}
                          className="border-green-400 text-green-300 hover:bg-green-700/30 bg-green-900/20"
                        >
                          <QrCode className="mr-1 h-3 w-3" />
                          {activeSession.qrCodeActive ? 'Disable QR' : 'Enable QR'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEndSession(activeSession.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Square className="mr-1 h-3 w-3" />
                          End Session
                        </Button>
                      </div>
                    </div>
                    
                    {activeSession && (
                      <div className="mt-3">
                        <QRCodeDisplay
                          sessionId={activeSession.id}
                          courseId={course.id}
                          courseCode={course.code}
                          courseName={course.name}
                          isActive={activeSession.qrCodeActive}
                          expiresAt={activeSession.qrCodeExpiresAt}
                          onRefresh={loadActiveSessions}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Course Description */}
                {course.description && (
                  <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-300 leading-relaxed">{course.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  {!activeSession ? (
                    <Button
                      onClick={() => openSessionDialog(course)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2.5"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Session
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {/* Navigate to attendance management */}}
                      className="flex-1 border-blue-400 text-blue-300 hover:bg-blue-700/30 bg-blue-900/20 font-semibold py-2.5"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      View Attendance
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {/* Navigate to course settings */}}
                    className="border-gray-600 hover:bg-gray-700 bg-gray-800 text-gray-300 px-4"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-8">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-white">No courses assigned</h3>
              <p className="text-gray-400">You don't have any courses assigned yet.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Session Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Class Session</DialogTitle>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedCourse.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCourse.code}</p>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  placeholder="Enter session location"
                />
              </div>

              <div>
                <Label htmlFor="attendance-window">Attendance Window (minutes)</Label>
                <Input
                  id="attendance-window"
                  type="number"
                  min="1"
                  max="60"
                  value={sessionForm.attendanceWindowMinutes}
                  onChange={(e) => setSessionForm({ ...sessionForm, attendanceWindowMinutes: parseInt(e.target.value) || 5 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="qr-active"
                  checked={sessionForm.qrCodeActive}
                  onCheckedChange={(checked) => setSessionForm({ ...sessionForm, qrCodeActive: checked })}
                />
                <Label htmlFor="qr-active">Enable QR Code</Label>
              </div>

              {selectedCourse.beacon && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="beacon-enabled"
                    checked={sessionForm.beaconEnabled}
                    onCheckedChange={(checked) => setSessionForm({ ...sessionForm, beaconEnabled: checked })}
                  />
                  <Label htmlFor="beacon-enabled">Enable Beacon Detection</Label>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSessionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedCourse && handleStartSession(selectedCourse)}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start Session
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {error && !isSessionDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MyCourses; 