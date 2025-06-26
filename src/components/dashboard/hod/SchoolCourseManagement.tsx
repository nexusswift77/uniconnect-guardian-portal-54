import React, { useState, useEffect } from 'react';
import { EnhancedUser, EnhancedCourse, BLEBeacon, PaginatedResponse } from '@/types/enhanced';
import { CourseService, BeaconService, UserService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Wifi, 
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  MapPin,
  GraduationCap
} from 'lucide-react';

interface SchoolCourseManagementProps {
  user: EnhancedUser;
}

interface CourseFormData {
  code: string;
  name: string;
  description: string;
  instructorId: string;
  location: string;
  department: string;
  semester: string;
  academicYear: string;
  maxStudents: number;
  beaconId: string;
  approvalRequired: boolean;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
  };
}

const SchoolCourseManagement: React.FC<SchoolCourseManagementProps> = ({ user }) => {
  const [courses, setCourses] = useState<EnhancedCourse[]>([]);
  const [lecturers, setLecturers] = useState<EnhancedUser[]>([]);
  const [beacons, setBeacons] = useState<BLEBeacon[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<EnhancedCourse | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    code: '',
    name: '',
    description: '',
    instructorId: '',
    location: '',
    department: '',
    semester: '',
    academicYear: new Date().getFullYear().toString(),
    maxStudents: 50,
    beaconId: 'none',
    approvalRequired: true,
    schedule: {
      days: [],
      startTime: '',
      endTime: ''
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [user.schoolId, currentPage, searchTerm, selectedDepartment, selectedSemester]);

  const loadData = async () => {
    if (!user.schoolId) return;
    
    try {
      setLoading(true);
      
      // Load courses for the school
      const coursesResponse = await CourseService.getCoursesBySchool(
        user.schoolId, 
        1, 
        1000 // Load all courses for client-side filtering
      );
      setCourses(coursesResponse.data);
      setTotalPages(coursesResponse.totalPages);

      // Load lecturers for the school (using HOD-specific method for consistency)
      const lecturersResponse = await UserService.getUsersBySchoolForHOD(
        user.schoolId,
        1,
        100,
        'lecturer'
      );
      setLecturers(lecturersResponse.data);

      // Load available beacons for the school
      const beaconsResponse = await BeaconService.getBeaconsBySchool(user.schoolId, 1, 100);
      setBeacons(beaconsResponse.data.filter(beacon => 
        beacon.status === 'active' && !beacon.assignedToCourse
      ));

    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!user.schoolId) return;

    try {
      const courseData = {
        ...formData,
        schoolId: user.schoolId,
        instructorName: lecturers.find(l => l.id === formData.instructorId)?.name || '',
        room: formData.location,
        beaconId: formData.beaconId === 'none' ? undefined : formData.beaconId,
        beaconMacAddress: formData.beaconId === 'none' ? undefined : beacons.find(b => b.id === formData.beaconId)?.macAddress,
        startTime: formData.schedule.startTime,
        endTime: formData.schedule.endTime,
        days: formData.schedule.days
      };

      await CourseService.createCourse(courseData);
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating course:', error);
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      const courseData = {
        ...formData,
        instructorName: lecturers.find(l => l.id === formData.instructorId)?.name || '',
        room: formData.location,
        beaconId: formData.beaconId === 'none' ? undefined : formData.beaconId,
        beaconMacAddress: formData.beaconId === 'none' ? undefined : beacons.find(b => b.id === formData.beaconId)?.macAddress,
        startTime: formData.schedule.startTime,
        endTime: formData.schedule.endTime,
        days: formData.schedule.days
      };

      await CourseService.updateCourse(editingCourse.id, courseData);
      setEditingCourse(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await CourseService.deleteCourse(courseId);
      loadData();
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      instructorId: '',
      location: '',
      department: '',
      semester: '',
      academicYear: new Date().getFullYear().toString(),
      maxStudents: 50,
      beaconId: 'none',
      approvalRequired: true,
      schedule: {
        days: [],
        startTime: '',
        endTime: ''
      }
    });
  };

  const openEditDialog = (course: EnhancedCourse) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description || '',
      instructorId: course.instructorId,
      location: course.location || '',
      department: course.department || '',
      semester: course.semester || '',
      academicYear: course.academicYear || new Date().getFullYear().toString(),
      maxStudents: course.maxStudents,
      beaconId: course.beaconId || 'none',
      approvalRequired: course.approvalRequired,
      schedule: {
        days: course.days || [],
        startTime: course.startTime || '',
        endTime: course.endTime || ''
      }
    });
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || selectedDepartment === 'all' || course.department === selectedDepartment;
    const matchesSemester = !selectedSemester || selectedSemester === 'all' || course.semester === selectedSemester;
    
    return matchesSearch && matchesDepartment && matchesSemester;
  });

  const departments = [...new Set(courses.map(course => course.department).filter(Boolean))];
  const semesters = [...new Set(courses.map(course => course.semester).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Course Management</h2>
          <p className="text-muted-foreground">
            Manage courses for your school
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingCourse(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Edit Course' : 'Create New Course'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CS101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Select
                    value={formData.instructorId}
                    onValueChange={(value) => setFormData({ ...formData, instructorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {lecturers.map(lecturer => (
                        <SelectItem key={lecturer.id} value={lecturer.id}>
                          {lecturer.firstName} {lecturer.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    placeholder="e.g., Fall 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beacon">BLE Beacon (Optional)</Label>
                <Select
                  value={formData.beaconId}
                  onValueChange={(value) => setFormData({ ...formData, beaconId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select beacon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No beacon</SelectItem>
                    {beacons.map(beacon => (
                      <SelectItem key={beacon.id} value={beacon.id}>
                        {beacon.name} ({beacon.macAddress})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schedule</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.schedule.startTime}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        schedule: { ...formData.schedule, startTime: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.schedule.endTime}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        schedule: { ...formData.schedule, endTime: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="approvalRequired"
                  checked={formData.approvalRequired}
                  onChange={(e) => setFormData({ ...formData, approvalRequired: e.target.checked })}
                />
                <Label htmlFor="approvalRequired">Require approval for enrollment</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingCourse(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map(sem => (
                  <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedDepartment || selectedSemester
                  ? "No courses match your current filters."
                  : "Get started by creating your first course."}
              </p>
              {!searchTerm && !selectedDepartment && !selectedSemester && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{course.name}</h3>
                      <Badge variant="outline">{course.code}</Badge>
                      {course.approvalRequired && (
                        <Badge variant="secondary">Approval Required</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {course.instructor?.firstName} {course.instructor?.lastName}
                        </span>
                      </div>
                      {course.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{course.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{course.maxStudents} students max</span>
                      </div>
                      {course.beacon && (
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{course.beacon.name}</span>
                        </div>
                      )}
                    </div>

                    {course.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {course.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {course.department && (
                        <Badge variant="outline">{course.department}</Badge>
                      )}
                      {course.semester && (
                        <Badge variant="outline">{course.semester}</Badge>
                      )}
                      {course.startTime && course.endTime && (
                        <Badge variant="outline">
                          {course.startTime} - {course.endTime}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        openEditDialog(course);
                        setShowCreateDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default SchoolCourseManagement;