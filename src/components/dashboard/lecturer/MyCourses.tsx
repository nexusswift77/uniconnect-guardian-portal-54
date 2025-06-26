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
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{course.code}</p>
                    {course.department && (
                      <p className="text-xs text-muted-foreground mt-1">{course.department}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {activeSession && (
                      <Badge variant="default" className="bg-green-600">
                        <Play className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                    {course.beacon && (
                      <Badge variant="outline">
                        <Wifi className="mr-1 h-3 w-3" />
                        Beacon
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Course Info */}
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Max Students:</span> {course.maxStudents}
                  </div>
                  {course.location && (
                    <div className="col-span-2 flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{course.location}</span>
                    </div>
                  )}
                </div>

                {/* Beacon Status */}
                {beaconStatus && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Beacon Status</span>
                      <Badge variant={beaconStatus.status === 'active' ? 'default' : 'secondary'}>
                        {beaconStatus.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Battery className="h-3 w-3" />
                        <span>{beaconStatus.battery}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Signal className="h-3 w-3" />
                        <span>{beaconStatus.signal}dBm</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Session Info */}
                {activeSession && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">Session Active</p>
                        <p className="text-sm text-green-600">
                          Started: {new Date(activeSession.startTime).toLocaleTimeString()}
                        </p>
                        {activeSession.location && (
                          <p className="text-sm text-green-600">📍 {activeSession.location}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleQR(activeSession.id, !activeSession.qrCodeActive)}
                        >
                          <QrCode className="mr-1 h-3 w-3" />
                          {activeSession.qrCodeActive ? 'Disable QR' : 'Enable QR'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleEndSession(activeSession.id)}
                        >
                          <Square className="mr-1 h-3 w-3" />
                          End
                        </Button>
                      </div>
                    </div>
                    
                    {activeSession.qrCodeActive && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs text-center text-gray-600">QR Code Active</p>
                        <div className="mt-1 h-20 bg-gray-100 rounded flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Course Description */}
                {course.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {!activeSession ? (
                    <Button
                      onClick={() => openSessionDialog(course)}
                      className="flex-1"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Session
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {/* Navigate to attendance management */}}
                      className="flex-1"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      View Attendance
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => {/* Navigate to course settings */}}
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
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No courses assigned</h3>
              <p className="text-muted-foreground">You don't have any courses assigned yet.</p>
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