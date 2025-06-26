import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { AttendanceService } from '@/services/attendanceService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Settings, 
  Trash2, 
  Users, 
  BookOpen, 
  MapPin, 
  Clock,
  Edit,
  UserCheck,
  GraduationCap,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  instructor_id: string | null;
  instructor_name?: string;
  instructor_email?: string;
  location: string;
  schedule: any;
  studentsEnrolled?: number;
  attendanceRate?: number;
  created_at: string;
  updated_at: string;
}

interface Lecturer {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedCourses: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  student_id: string;
  enrolledCourses: number;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  student_id: string;
  enrolled_at: string;
  attendance_rate: number;
}

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
  student_id: string;
  totalEnrollments: number;
}

export default function CourseManagementPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [selectedStudentsForEnrollment, setSelectedStudentsForEnrollment] = useState<string[]>([]);
  
  // Form states
  const [newCourseData, setNewCourseData] = useState({
    code: '',
    name: '',
    instructor_id: '',
    location: '',
    schedule: { days: [], start_time: '', end_time: '' }
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, lecturersData, studentsData] = await Promise.all([
        AttendanceService.getAllCourses(),
        AttendanceService.getAllLecturers(),
        AttendanceService.getAllStudents()
      ]);
      
      setCourses(coursesData);
      setLecturers(lecturersData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      if (!newCourseData.code || !newCourseData.name || !newCourseData.location) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const course = await AttendanceService.createCourse({
        code: newCourseData.code,
        name: newCourseData.name,
        instructor_id: newCourseData.instructor_id || null,
        location: newCourseData.location,
        schedule: newCourseData.schedule
      });

      if (course) {
        toast({
          title: "Success",
          description: "Course created successfully",
        });
        setIsCreateDialogOpen(false);
        setNewCourseData({
          code: '',
          name: '',
          instructor_id: '',
          location: '',
          schedule: { days: [], start_time: '', end_time: '' }
        });
        loadData();
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    }
  };

  const handleAssignLecturer = async (courseId: string, lecturerId: string | null) => {
    try {
      const success = await AttendanceService.assignLecturerToCourse(courseId, lecturerId);
      if (success) {
        toast({
          title: "Success",
          description: lecturerId ? "Lecturer assigned successfully" : "Lecturer unassigned successfully",
        });
        loadData();
      }
    } catch (error) {
      console.error('Error assigning lecturer:', error);
      toast({
        title: "Error",
        description: "Failed to assign lecturer",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await AttendanceService.deleteCourse(courseId);
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      loadData();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const handleEnrollStudent = async (studentId: string, courseId: string) => {
    try {
      const success = await AttendanceService.enrollStudentInCourse(studentId, courseId);
      if (success) {
        toast({
          title: "Success",
          description: "Student enrolled successfully",
        });
        loadData();
        if (selectedCourse && selectedCourse.id === courseId) {
          loadCourseDetails(courseId);
        }
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: "Error",
        description: "Failed to enroll student",
        variant: "destructive",
      });
    }
  };

  const loadCourseDetails = async (courseId: string) => {
    try {
      const [enrolled, available] = await Promise.all([
        AttendanceService.getCourseEnrollments(courseId),
        AttendanceService.getAvailableStudentsForCourse(courseId)
      ]);
      setEnrolledStudents(enrolled);
      setAvailableStudents(available);
    } catch (error) {
      console.error('Error loading course details:', error);
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStudent = async (studentId: string, courseId: string) => {
    try {
      const success = await AttendanceService.removeStudentFromCourse(studentId, courseId);
      if (success) {
        toast({
          title: "Success",
          description: "Student removed from course",
        });
        loadData();
        loadCourseDetails(courseId);
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student",
        variant: "destructive",
      });
    }
  };

  const handleBulkEnrollment = async (courseId: string) => {
    if (selectedStudentsForEnrollment.length === 0) {
      toast({
        title: "Error",
        description: "Please select students to enroll",
        variant: "destructive",
      });
      return;
    }

    try {
      const results = await AttendanceService.bulkEnrollStudents(selectedStudentsForEnrollment, courseId);
      
      if (results.success > 0) {
        toast({
          title: "Success",
          description: `${results.success} students enrolled successfully${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
        });
      }
      
      if (results.failed > 0 && results.errors.length > 0) {
        console.error('Enrollment errors:', results.errors);
      }

      setSelectedStudentsForEnrollment([]);
      loadData();
      loadCourseDetails(courseId);
    } catch (error) {
      console.error('Error with bulk enrollment:', error);
      toast({
        title: "Error",
        description: "Failed to enroll students",
        variant: "destructive",
      });
    }
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Course Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-6 bg-white/10 rounded mb-4"></div>
                <div className="h-4 bg-white/10 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Course Management</h1>
          <p className="text-white/70">Manage courses, assign lecturers, and oversee enrollments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900/95 border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    value={newCourseData.code}
                    onChange={(e) => setNewCourseData({ ...newCourseData, code: e.target.value })}
                    placeholder="e.g., CS101"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={newCourseData.location}
                    onChange={(e) => setNewCourseData({ ...newCourseData, location: e.target.value })}
                    placeholder="e.g., Room A101"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={newCourseData.name}
                  onChange={(e) => setNewCourseData({ ...newCourseData, name: e.target.value })}
                  placeholder="e.g., Introduction to Computer Science"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label htmlFor="instructor">Assign Lecturer (Optional)</Label>
                <Select
                  value={newCourseData.instructor_id}
                  onValueChange={(value) => setNewCourseData({ ...newCourseData, instructor_id: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a lecturer" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10">
                    <SelectItem value="">No assignment</SelectItem>
                    {lecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>
                        {lecturer.name} ({lecturer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} className="bg-sky-500 hover:bg-sky-600">
                  Create Course
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-sky-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Active Lecturers</p>
                <p className="text-2xl font-bold text-white">{lecturers.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-white">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Avg Attendance</p>
                <p className="text-2xl font-bold text-white">
                  {courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + c.attendanceRate, 0) / courses.length) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
          <Input
            placeholder="Search courses, lecturers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="courses" className="data-[state=active]:bg-sky-500">
            Courses
          </TabsTrigger>
          <TabsTrigger value="lecturers" className="data-[state=active]:bg-sky-500">
            Lecturers
          </TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-sky-500">
            Students
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {filteredCourses.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No courses found</h3>
                <p className="text-white/70 mb-4">
                  {searchTerm ? 'No courses match your search criteria.' : 'Get started by creating your first course.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-sky-500 hover:bg-sky-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{course.code}</CardTitle>
                        <p className="text-white/70 text-sm mt-1">{course.name}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900/95 border-white/10 text-white">
                            <DialogHeader>
                              <DialogTitle>Assign Lecturer to {course.code}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Current Assignment</Label>
                                <p className="text-white/70">
                                  {course.instructor_name === 'Unassigned' ? 'No lecturer assigned' : course.instructor_name}
                                </p>
                              </div>
                              <div>
                                <Label>New Assignment</Label>
                                <Select onValueChange={(value) => handleAssignLecturer(course.id, value === 'unassign' ? null : value)}>
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select a lecturer" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-900 border-white/10">
                                    <SelectItem value="unassign">Unassign lecturer</SelectItem>
                                    {lecturers.map((lecturer) => (
                                      <SelectItem key={lecturer.id} value={lecturer.id}>
                                        {lecturer.name} ({lecturer.assignedCourses} courses)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900/95 border-white/10 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/70">
                                Are you sure you want to delete "{course.code} - {course.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCourse(course.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-white/70">
                      <UserCheck className="h-4 w-4 mr-2" />
                      {!course.instructor_name || course.instructor_name === 'Unassigned' ? (
                        <Badge variant="outline" className="border-orange-500 text-orange-400">
                          Unassigned
                        </Badge>
                      ) : (
                        <span>{course.instructor_name}</span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-white/70">
                      <MapPin className="h-4 w-4 mr-2" />
                      {course.location}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-white/70">
                        <Users className="h-4 w-4 mr-2" />
                        {course.studentsEnrolled || 0} students
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          (course.attendanceRate || 0) >= 80 
                            ? 'border-green-500 text-green-400' 
                            : (course.attendanceRate || 0) >= 60 
                            ? 'border-yellow-500 text-yellow-400'
                            : 'border-red-500 text-red-400'
                        }`}
                      >
                        {course.attendanceRate || 0}% attendance
                      </Badge>
                    </div>
                    {/* Manage Students Button */}
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                            onClick={() => {
                              setSelectedCourse(course);
                              loadCourseDetails(course.id);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Manage Students
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900/95 border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Manage Students - {course.code}: {course.name}</DialogTitle>
                          </DialogHeader>
                          <Tabs defaultValue="enrolled" className="space-y-4">
                            <TabsList className="bg-white/5 border-white/10">
                              <TabsTrigger value="enrolled" className="data-[state=active]:bg-sky-500">
                                Enrolled Students ({enrolledStudents.length})
                              </TabsTrigger>
                              <TabsTrigger value="available" className="data-[state=active]:bg-sky-500">
                                Available Students ({availableStudents.length})
                              </TabsTrigger>
                            </TabsList>

                            {/* Enrolled Students Tab */}
                            <TabsContent value="enrolled" className="space-y-4">
                              {enrolledStudents.length === 0 ? (
                                <div className="text-center py-8">
                                  <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
                                  <p className="text-white/70">No students enrolled in this course</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {enrolledStudents.map((student) => (
                                    <Card key={student.id} className="bg-white/5 border-white/10">
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <h4 className="font-semibold text-white">{student.name}</h4>
                                            <p className="text-white/70 text-sm">{student.email}</p>
                                            <p className="text-white/50 text-xs">ID: {student.student_id}</p>
                                            <p className="text-white/50 text-xs">
                                              Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <Badge 
                                              variant="outline" 
                                              className={`${
                                                student.attendance_rate >= 80 
                                                  ? 'border-green-500 text-green-400' 
                                                  : student.attendance_rate >= 60 
                                                  ? 'border-yellow-500 text-yellow-400'
                                                  : 'border-red-500 text-red-400'
                                              } mb-2`}
                                            >
                                              {student.attendance_rate}% attendance
                                            </Badge>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent className="bg-gray-900/95 border-white/10 text-white">
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Remove Student</AlertDialogTitle>
                                                  <AlertDialogDescription className="text-white/70">
                                                    Are you sure you want to remove {student.name} from this course?
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                                    Cancel
                                                  </AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() => handleRemoveStudent(student.id, course.id)}
                                                    className="bg-red-500 hover:bg-red-600"
                                                  >
                                                    Remove
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </TabsContent>

                            {/* Available Students Tab */}
                            <TabsContent value="available" className="space-y-4">
                              {availableStudents.length === 0 ? (
                                <div className="text-center py-8">
                                  <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
                                  <p className="text-white/70">All students are already enrolled in this course</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <p className="text-white/70">Select students to enroll:</p>
                                    <Button 
                                      onClick={() => handleBulkEnrollment(course.id)}
                                      disabled={selectedStudentsForEnrollment.length === 0}
                                      className="bg-sky-500 hover:bg-sky-600"
                                    >
                                      Enroll Selected ({selectedStudentsForEnrollment.length})
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableStudents.map((student) => (
                                      <Card 
                                        key={student.id} 
                                        className={`bg-white/5 border-white/10 cursor-pointer transition-colors ${
                                          selectedStudentsForEnrollment.includes(student.id) 
                                            ? 'bg-sky-500/20 border-sky-500' 
                                            : 'hover:bg-white/10'
                                        }`}
                                        onClick={() => {
                                          setSelectedStudentsForEnrollment(prev => 
                                            prev.includes(student.id)
                                              ? prev.filter(id => id !== student.id)
                                              : [...prev, student.id]
                                          );
                                        }}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <h4 className="font-semibold text-white">{student.name}</h4>
                                              <p className="text-white/70 text-sm">{student.email}</p>
                                              <p className="text-white/50 text-xs">ID: {student.student_id}</p>
                                            </div>
                                            <div className="text-right">
                                              <Badge variant="outline" className="border-white/20 text-white/70">
                                                {student.totalEnrollments} courses
                                              </Badge>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Lecturers Tab */}
        <TabsContent value="lecturers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lecturers.map((lecturer) => (
              <Card key={lecturer.id} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{lecturer.name}</h3>
                      <p className="text-white/70 text-sm">{lecturer.email}</p>
                    </div>
                    <Badge variant="outline" className="border-sky-500 text-sky-400">
                      {lecturer.role}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Assigned Courses</span>
                    <span className="text-white font-semibold">{lecturer.assignedCourses}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <Card key={student.id} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{student.name}</h3>
                      <p className="text-white/70 text-sm">{student.email}</p>
                      <p className="text-white/50 text-xs">ID: {student.student_id}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900/95 border-white/10 text-white">
                        <DialogHeader>
                          <DialogTitle>Enroll {student.name} in Course</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select onValueChange={(value) => handleEnrollStudent(student.id, value)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-white/10">
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Enrolled Courses</span>
                    <span className="text-white font-semibold">{student.enrolledCourses}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 