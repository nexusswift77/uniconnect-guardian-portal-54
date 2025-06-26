import React, { useState, useEffect } from 'react';
import { EnhancedUser, School, BLEBeacon, EnhancedCourse } from '@/types/enhanced';
import { BeaconService } from '@/services/beaconService';
import { CourseService } from '@/services/courseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wifi, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Battery, 
  Signal, 
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Pause,
  Settings
} from 'lucide-react';

interface SchoolBeaconManagementProps {
  user: EnhancedUser;
  school: School | null;
  onUpdate: () => void;
}

interface BeaconFormData {
  beaconUid: string;
  macAddress: string;
  name: string;
  location: string;
  batteryLevel: number;
  signalStrength: number;
  status: 'active' | 'inactive' | 'maintenance' | 'lost';
}

const SchoolBeaconManagement: React.FC<SchoolBeaconManagementProps> = ({ user, school, onUpdate }) => {
  const [beacons, setBeacons] = useState<BLEBeacon[]>([]);
  const [courses, setCourses] = useState<EnhancedCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingBeacon, setEditingBeacon] = useState<BLEBeacon | null>(null);
  const [selectedBeaconForAssignment, setSelectedBeaconForAssignment] = useState<BLEBeacon | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [formData, setFormData] = useState<BeaconFormData>({
    beaconUid: '',
    macAddress: '',
    name: '',
    location: '',
    batteryLevel: 100,
    signalStrength: -50,
    status: 'inactive'
  });

  useEffect(() => {
    loadData();
  }, [user.schoolId]);

  const loadData = async () => {
    if (!user.schoolId) return;
    
    try {
      setLoading(true);
      
      // Load beacons for the school
      const beaconsResponse = await BeaconService.getBeaconsBySchool(user.schoolId, 1, 100);
      setBeacons(beaconsResponse.data);

      // Load courses for assignment
      const coursesResponse = await CourseService.getCoursesBySchool(user.schoolId, 1, 100);
      setCourses(coursesResponse.data);
    } catch (error) {
      console.error('Error loading beacon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBeacon = async () => {
    if (!user.schoolId) return;

    try {
      const beaconData = {
        beaconUid: formData.beaconUid,
        macAddress: formData.macAddress,
        name: formData.name,
        schoolId: user.schoolId,
        location: formData.location
      };

      const result = await BeaconService.createBeacon(beaconData);
      
      if (result.error) {
        alert('Error creating beacon: ' + result.error);
        return;
      }

      // If beacon was created successfully and we have additional properties to update
      if (result.data && (formData.batteryLevel !== 100 || formData.signalStrength !== -50 || formData.status !== 'inactive')) {
        await BeaconService.updateBeacon(result.data.id, {
          batteryLevel: formData.batteryLevel,
          signalStrength: formData.signalStrength,
          status: formData.status
        });
      }

      setShowCreateDialog(false);
      resetForm();
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error creating beacon:', error);
      alert('Error creating beacon: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUpdateBeacon = async () => {
    if (!editingBeacon) return;

    try {
      const result = await BeaconService.updateBeacon(editingBeacon.id, {
        beaconUid: formData.beaconUid,
        macAddress: formData.macAddress,
        name: formData.name,
        location: formData.location,
        batteryLevel: formData.batteryLevel,
        signalStrength: formData.signalStrength,
        status: formData.status
      });

      if (result.error) {
        alert('Error updating beacon: ' + result.error);
        return;
      }

      setShowCreateDialog(false);
      setEditingBeacon(null);
      resetForm();
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error updating beacon:', error);
      alert('Error updating beacon: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteBeacon = async (beaconId: string) => {
    if (!confirm('Are you sure you want to delete this beacon? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await BeaconService.deleteBeacon(beaconId);
      
      if (result.error) {
        alert('Error deleting beacon: ' + result.error);
        return;
      }

      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error deleting beacon:', error);
      alert('Error deleting beacon: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleAssignBeacon = async () => {
    if (!selectedBeaconForAssignment || !selectedCourseId) return;

    try {
      const result = await BeaconService.assignBeaconToCourse(selectedBeaconForAssignment.id, selectedCourseId);
      
      if (result.error) {
        alert('Error assigning beacon: ' + result.error);
        return;
      }

      setShowAssignDialog(false);
      setSelectedBeaconForAssignment(null);
      setSelectedCourseId('');
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error assigning beacon:', error);
      alert('Error assigning beacon: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUnassignBeacon = async (beaconId: string) => {
    if (!confirm('Are you sure you want to unassign this beacon from its course?')) {
      return;
    }

    try {
      const result = await BeaconService.unassignBeaconFromCourse(beaconId);
      
      if (result.error) {
        alert('Error unassigning beacon: ' + result.error);
        return;
      }

      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error unassigning beacon:', error);
      alert('Error unassigning beacon: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      beaconUid: '',
      macAddress: '',
      name: '',
      location: '',
      batteryLevel: 100,
      signalStrength: -50,
      status: 'inactive'
    });
  };

  const openEditDialog = (beacon: BLEBeacon) => {
    setEditingBeacon(beacon);
    setFormData({
      beaconUid: beacon.beaconUid,
      macAddress: beacon.macAddress,
      name: beacon.name,
      location: beacon.location || '',
      batteryLevel: beacon.batteryLevel || 100,
      signalStrength: beacon.signalStrength || -50,
      status: beacon.status
    });
    setShowCreateDialog(true);
  };

  const openAssignDialog = (beacon: BLEBeacon) => {
    setSelectedBeaconForAssignment(beacon);
    setShowAssignDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle2;
      case 'inactive': return Pause;
      case 'maintenance': return Settings;
      case 'lost': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignalColor = (strength: number) => {
    if (strength > -60) return 'text-green-600';
    if (strength > -80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const activeBeacons = beacons.filter(b => b.status === 'active').length;
  const assignedBeacons = beacons.filter(b => b.assignedToCourse).length;
  const availableBeacons = beacons.filter(b => !b.assignedToCourse && b.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Beacon Management</h2>
        <p className="text-muted-foreground">
          Manage BLE beacons for {school?.name || 'your school'}
        </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Beacon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Beacons</p>
                <p className="text-2xl font-bold">{beacons.length}</p>
              </div>
              <Wifi className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeBeacons}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{assignedBeacons}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-orange-600">{availableBeacons}</p>
              </div>
              <Wifi className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beacons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Beacon Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading beacons...</div>
          ) : beacons.length === 0 ? (
            <div className="text-center py-8">
              <Wifi className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No beacons found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first beacon to the system.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Beacon
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Beacon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beacons.map((beacon) => {
                  const StatusIcon = getStatusIcon(beacon.status);
                  return (
                    <TableRow key={beacon.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{beacon.name}</div>
                          <div className="text-sm text-muted-foreground">
                            UID: {beacon.beaconUid}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            MAC: {beacon.macAddress}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(beacon.status)}`} />
                          <StatusIcon className="h-4 w-4" />
                          <span className="capitalize">{beacon.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{beacon.location || 'Not set'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Battery className={`h-4 w-4 ${getBatteryColor(beacon.batteryLevel || 0)}`} />
                          <span className={getBatteryColor(beacon.batteryLevel || 0)}>
                            {beacon.batteryLevel || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Signal className={`h-4 w-4 ${getSignalColor(beacon.signalStrength || -100)}`} />
                          <span className={getSignalColor(beacon.signalStrength || -100)}>
                            {beacon.signalStrength || 'N/A'} dBm
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {beacon.assignedToCourse ? (
                          <div>
                            <Badge variant="outline">{beacon.course?.code}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {beacon.course?.name}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(beacon)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {beacon.assignedToCourse ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnassignBeacon(beacon.id)}
                            >
                              Unassign
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignDialog(beacon)}
                              disabled={beacon.status !== 'active'}
                            >
                              Assign
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBeacon(beacon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
          </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Beacon Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBeacon ? 'Edit Beacon' : 'Add New Beacon'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="beaconUid">Beacon UID</Label>
              <Input
                id="beaconUid"
                value={formData.beaconUid}
                onChange={(e) => setFormData({ ...formData, beaconUid: e.target.value })}
                placeholder="e.g., 550e8400-e29b-41d4-a716"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="macAddress">MAC Address</Label>
              <Input
                id="macAddress"
                value={formData.macAddress}
                onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                placeholder="e.g., AA:BB:CC:DD:EE:FF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Lecture Hall A Beacon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Room 101, Building A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batteryLevel">Battery Level (%)</Label>
                <Input
                  id="batteryLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryLevel}
                  onChange={(e) => setFormData({ ...formData, batteryLevel: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signalStrength">Signal Strength (dBm)</Label>
                <Input
                  id="signalStrength"
                  type="number"
                  min="-100"
                  max="0"
                  value={formData.signalStrength}
                  onChange={(e) => setFormData({ ...formData, signalStrength: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingBeacon(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={editingBeacon ? handleUpdateBeacon : handleCreateBeacon}>
                {editingBeacon ? 'Update Beacon' : 'Create Beacon'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Beacon Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Beacon to Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBeaconForAssignment && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedBeaconForAssignment.name}</h4>
                <p className="text-sm text-muted-foreground">
                  UID: {selectedBeaconForAssignment.beaconUid}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="courseSelect">Select Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .filter(course => !course.beaconId) // Only show courses without beacons
                    .map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignDialog(false);
                  setSelectedBeaconForAssignment(null);
                  setSelectedCourseId('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignBeacon}
                disabled={!selectedCourseId}
              >
                Assign Beacon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolBeaconManagement; 