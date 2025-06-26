import { supabase } from '@/lib/supabaseClient';
import { EnhancedClassSession, EnhancedAttendanceRecord, ApiResponse } from '@/types/enhanced';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  method: 'BLE' | 'QR' | 'manual';
  status: 'verified' | 'pending' | 'absent' | 'late';
  check_in_time: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  // Joined fields
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    student_id: string;
    email: string;
  };
  session?: {
    id: string;
    course_id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    course?: {
      code: string;
      name: string;
    };
  };
}

export interface Student {
  id: string;
  name: string;
  studentId: string;
  checkInTime?: string;
  method: 'BLE' | 'QR' | 'Absent';
  status: 'verified' | 'pending' | 'absent';
  courseCode?: string;
  courseName?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor_id: string;
  instructor_name?: string;
  location: string;
  schedule: any; // JSON object with schedule data
  created_at: string;
  updated_at: string;
  // Computed fields
  studentsEnrolled?: number;
  attendanceRate?: number;
  todaySession?: ClassSession;
}

export interface ClassSession {
  id: string;
  course_id: string;
  instructor_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  qr_code_active: boolean;
  beacon_enabled: boolean;
  session_notes?: string;
  created_at: string;
  // Joined fields
  course?: Course;
  attendance_count?: number;
  total_enrolled?: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor_id: string;
  instructor_name?: string;
  location: string;
  schedule: any; // JSON object with schedule data
  created_at: string;
  updated_at: string;
  // Computed fields
  studentsEnrolled?: number;
  attendanceRate?: number;
  todaySession?: ClassSession;
}

export interface ClassSession {
  id: string;
  course_id: string;
  instructor_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  qr_code_active: boolean;
  beacon_enabled: boolean;
  session_notes?: string;
  created_at: string;
  // Joined fields
  course?: Course;
  attendance_count?: number;
  total_enrolled?: number;
}

export class AttendanceService {
  // Get today's attendance records for a specific session
  static async getTodayAttendance(sessionId?: string): Promise<Student[]> {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          student:users!attendance_records_student_id_fkey(
            id, first_name, last_name, student_id, email
          ),
          session:class_sessions!attendance_records_session_id_fkey(
            id, course_id, session_date, start_time, end_time,
            course:courses!class_sessions_course_id_fkey(code, name)
          )
        `)
        .eq('session.session_date', new Date().toISOString().split('T')[0]);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform to Student interface format
      return data.map((record: any) => ({
        id: record.student.id,
        name: `${record.student.first_name} ${record.student.last_name}`,
        studentId: record.student.student_id,
        checkInTime: record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }) : undefined,
        method: record.method === 'manual' ? 'Absent' : record.method,
        status: record.status,
        courseCode: record.session?.course?.code,
        courseName: record.session?.course?.name,
      })) as Student[];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  }

  // Get all enrolled students for a course/session (to show who's absent)
  static async getEnrolledStudents(courseId: string): Promise<Student[]> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          student:users!course_enrollments_student_id_fkey(
            id, first_name, last_name, student_id, email
          ),
          course:courses!course_enrollments_course_id_fkey(code, name)
        `)
        .eq('course_id', courseId);

      if (error) throw error;

      return data.map((enrollment: any) => ({
        id: enrollment.student.id,
        name: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
        studentId: enrollment.student.student_id,
        method: 'Absent',
        status: 'absent',
        courseCode: enrollment.course.code,
        courseName: enrollment.course.name,
      })) as Student[];
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      return [];
    }
  }

  // Approve a pending attendance record
  static async approveAttendance(recordId: string, verifiedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          status: 'verified',
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving attendance:', error);
      throw error;
    }
  }

  // Reject a pending attendance record
  static async rejectAttendance(recordId: string, verifiedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({
          status: 'absent',
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      throw error;
    }
  }

  // Get active class sessions for today
  static async getTodayActiveSessions(instructorId: string): Promise<EnhancedClassSession[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
      
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses (
            id,
            name,
            code,
            location
          ),
          beacon:ble_beacons (
            id,
            name,
            status,
            battery_level,
            signal_strength
          )
        `)
        .eq('instructor_id', instructorId)
        .eq('session_date', today)
        .gte('end_time', currentTime); // Session hasn't ended yet

      if (error) throw error;
      
      const activeSessions = data?.map(session => this.mapToEnhancedClassSession(session)) || [];
      return activeSessions;
    } catch (error) {
      console.error('Error fetching today\'s active sessions:', error);
      return [];
    }
  }

  // Get courses for a specific instructor
  static async getInstructorCourses(instructorId: string): Promise<Course[]> {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(first_name, last_name)
        `)
        .eq('instructor_id', instructorId);

      if (error) throw error;

      // Get enrollment counts and attendance rates for each course
      const coursesWithStats = await Promise.all(
        courses.map(async (course: any) => {
          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get attendance rate for the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: sessionsData } = await supabase
            .from('class_sessions')
            .select(`
              id,
              session_date,
              attendance_records(count)
            `)
            .eq('course_id', course.id)
            .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0]);

          let totalSessions = sessionsData?.length || 0;
          let totalAttendance = 0;
          
          if (sessionsData) {
            for (const session of sessionsData) {
              const { count } = await supabase
                .from('attendance_records')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', session.id)
                .eq('status', 'verified');
              totalAttendance += count || 0;
            }
          }

          const attendanceRate = totalSessions > 0 && enrollmentCount ? 
            Math.round((totalAttendance / (totalSessions * enrollmentCount)) * 100) : 0;

          // Check if there's a session today
          const { data: todaySession } = await supabase
            .from('class_sessions')
            .select('*')
            .eq('course_id', course.id)
            .eq('session_date', new Date().toISOString().split('T')[0])
            .single();

          return {
            id: course.id,
            code: course.code,
            name: course.name,
            instructor_id: course.instructor_id,
            instructor_name: `${course.instructor.first_name} ${course.instructor.last_name}`,
            location: course.location,
            schedule: course.schedule,
            created_at: course.created_at,
            updated_at: course.updated_at,
            studentsEnrolled: enrollmentCount || 0,
            attendanceRate,
            todaySession: todaySession || null,
          } as Course;
        })
      );

      return coursesWithStats;
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      return [];
    }
  }

  // Get class sessions for a specific course
  static async getCourseClassSessions(courseId: string, limit: number = 10): Promise<ClassSession[]> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          course:courses!class_sessions_course_id_fkey(id, code, name)
        `)
        .eq('course_id', courseId)
        .order('session_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get attendance counts for each session
      const sessionsWithAttendance = await Promise.all(
        data.map(async (session: any) => {
          const { count: attendanceCount } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('status', 'verified');

          const { count: totalEnrolled } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', session.course_id);

          return {
            ...session,
            attendance_count: attendanceCount || 0,
            total_enrolled: totalEnrolled || 0,
          } as ClassSession;
        })
      );

      return sessionsWithAttendance;
    } catch (error) {
      console.error('Error fetching course sessions:', error);
      return [];
    }
  }

  // Create a new class session
  static async createClassSession(sessionData: {
    course_id: string;
    instructor_id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    location: string;
    session_notes?: string;
  }): Promise<ClassSession | null> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          ...sessionData,
          qr_code_active: false,
          beacon_enabled: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ClassSession;
    } catch (error) {
      console.error('Error creating class session:', error);
      return null;
    }
  }

  // Update class session settings (QR/Beacon)
  static async updateSessionSettings(sessionId: string, settings: {
    qr_code_active?: boolean;
    beacon_enabled?: boolean;
    session_notes?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('class_sessions')
        .update(settings)
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating session settings:', error);
      return false;
    }
  }

  // Get attendance analytics for a course
  static async getCourseAttendanceAnalytics(courseId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select(`
          id,
          session_date,
          start_time,
          end_time
        `)
        .eq('course_id', courseId)
        .gte('session_date', startDate.toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      if (error) throw error;

      const analytics = await Promise.all(
        sessions.map(async (session: any) => {
          const { count: presentCount } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('status', 'verified');

          const { count: lateCount } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('status', 'late');

          const { count: totalEnrolled } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);

          const absentCount = (totalEnrolled || 0) - (presentCount || 0) - (lateCount || 0);

          return {
            date: session.session_date,
            time: `${session.start_time} - ${session.end_time}`,
            present: presentCount || 0,
            late: lateCount || 0,
            absent: Math.max(0, absentCount),
            total: totalEnrolled || 0,
            attendanceRate: totalEnrolled ? Math.round(((presentCount || 0) / totalEnrolled) * 100) : 0,
          };
        })
      );

      return analytics;
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      return [];
    }
  }

  // ADMIN FUNCTIONALITY - Course Management

  // Get all courses (for admin/head_lecturer)
  static async getAllCourses(): Promise<Course[]> {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!courses_instructor_id_fkey(first_name, last_name, email)
        `)
        .order('code', { ascending: true });

      if (error) throw error;

      // Get enrollment counts and attendance rates for each course
      const coursesWithStats = await Promise.all(
        courses.map(async (course: any) => {
          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          // Get attendance rate for the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: sessionsData } = await supabase
            .from('class_sessions')
            .select('id, session_date')
            .eq('course_id', course.id)
            .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0]);

          let totalSessions = sessionsData?.length || 0;
          let totalAttendance = 0;
          
          if (sessionsData) {
            for (const session of sessionsData) {
              const { count } = await supabase
                .from('attendance_records')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', session.id)
                .eq('status', 'verified');
              totalAttendance += count || 0;
            }
          }

          const attendanceRate = totalSessions > 0 && enrollmentCount ? 
            Math.round((totalAttendance / (totalSessions * enrollmentCount)) * 100) : 0;

          return {
            id: course.id,
            code: course.code,
            name: course.name,
            instructor_id: course.instructor_id,
            instructor_name: course.instructor ? `${course.instructor.first_name} ${course.instructor.last_name}` : 'Unassigned',
            instructor_email: course.instructor?.email || '',
            location: course.location,
            schedule: course.schedule,
            created_at: course.created_at,
            updated_at: course.updated_at,
            studentsEnrolled: enrollmentCount || 0,
            attendanceRate,
          } as Course & { instructor_email: string };
        })
      );

      return coursesWithStats;
    } catch (error) {
      console.error('Error fetching all courses:', error);
      return [];
    }
  }

  // Get all lecturers (for assignment)
  static async getAllLecturers(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    assignedCourses: number;
  }>> {
    try {
      const { data: lecturers, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .in('role', ['lecturer', 'head_lecturer'])
        .order('first_name', { ascending: true });

      if (error) throw error;

      // Get course counts for each lecturer
      const lecturersWithCourses = await Promise.all(
        lecturers.map(async (lecturer: any) => {
          const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', lecturer.id);

          return {
            id: lecturer.id,
            name: `${lecturer.first_name} ${lecturer.last_name}`,
            email: lecturer.email,
            role: lecturer.role,
            assignedCourses: courseCount || 0,
          };
        })
      );

      return lecturersWithCourses;
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      return [];
    }
  }

  // Create a new course
  static async createCourse(courseData: {
    code: string;
    name: string;
    instructor_id?: string;
    location: string;
    schedule: any;
  }): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  }

  // Update course assignment
  static async assignLecturerToCourse(courseId: string, lecturerId: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ instructor_id: lecturerId })
        .eq('id', courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning lecturer to course:', error);
      return false;
    }
  }

  // Update course details
  static async updateCourse(courseId: string, updates: {
    code?: string;
    name?: string;
    location?: string;
    schedule?: any;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating course:', error);
      return false;
    }
  }

  // Delete a course
  static async deleteCourse(courseId: string): Promise<boolean> {
    try {
      // First check if there are any sessions or enrollments
      const { count: sessionsCount } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      const { count: enrollmentsCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      if ((sessionsCount || 0) > 0 || (enrollmentsCount || 0) > 0) {
        throw new Error('Cannot delete course with existing sessions or enrollments');
      }

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // Get students for enrollment management
  static async getAllStudents(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    student_id: string;
    enrolledCourses: number;
  }>> {
    try {
      const { data: students, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, student_id')
        .eq('role', 'student')
        .order('first_name', { ascending: true });

      if (error) throw error;

      // Get enrollment counts for each student
      const studentsWithEnrollments = await Promise.all(
        students.map(async (student: any) => {
          const { count: enrollmentCount } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id);

          return {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            student_id: student.student_id,
            enrolledCourses: enrollmentCount || 0,
          };
        })
      );

      return studentsWithEnrollments;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  // Enroll student in course
  static async enrollStudentInCourse(studentId: string, courseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error enrolling student:', error);
      return false;
    }
  }

  // Remove student from course
  static async removeStudentFromCourse(studentId: string, courseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing student from course:', error);
      return false;
    }
  }

  // Get enrolled students for a specific course
  static async getCourseEnrollments(courseId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    student_id: string;
    enrolled_at: string;
    attendance_rate: number;
  }>> {
    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          student:users!course_enrollments_student_id_fkey(
            id, first_name, last_name, email, student_id
          )
        `)
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: true });

      if (error) throw error;

      // Calculate attendance rate for each student in this course
      const enrollmentsWithStats = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          // Get total sessions for this course
          const { count: totalSessions } = await supabase
            .from('class_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', courseId);

          // Get attendance records for this student in this course
          const { count: attendedSessions } = await supabase
            .from('attendance_records')
            .select(`
              *,
              session:class_sessions!attendance_records_session_id_fkey(course_id)
            `, { count: 'exact', head: true })
            .eq('student_id', enrollment.student.id)
            .eq('status', 'verified');

          const attendanceRate = totalSessions && totalSessions > 0 ? 
            Math.round((attendedSessions || 0) / totalSessions * 100) : 0;

          return {
            id: enrollment.student.id,
            name: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
            email: enrollment.student.email,
            student_id: enrollment.student.student_id,
            enrolled_at: enrollment.enrolled_at,
            attendance_rate: attendanceRate,
          };
        })
      );

      return enrollmentsWithStats;
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      return [];
    }
  }

  // Get available students for enrollment (not already enrolled in the course)
  static async getAvailableStudentsForCourse(courseId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    student_id: string;
    totalEnrollments: number;
  }>> {
    try {
      // Get all students
      const { data: allStudents, error: studentsError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, student_id')
        .eq('role', 'student')
        .order('first_name', { ascending: true });

      if (studentsError) throw studentsError;

      // Get students already enrolled in this course
      const { data: enrolledStudents, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId);

      if (enrollmentError) throw enrollmentError;

      const enrolledStudentIds = new Set(enrolledStudents.map(e => e.student_id));

      // Filter out already enrolled students and add enrollment counts
      const availableStudents = await Promise.all(
        allStudents
          .filter(student => !enrolledStudentIds.has(student.id))
          .map(async (student: any) => {
            const { count: totalEnrollments } = await supabase
              .from('course_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', student.id);

            return {
              id: student.id,
              name: `${student.first_name} ${student.last_name}`,
              email: student.email,
              student_id: student.student_id,
              totalEnrollments: totalEnrollments || 0,
            };
          })
      );

      return availableStudents;
    } catch (error) {
      console.error('Error fetching available students:', error);
      return [];
    }
  }

  // Bulk enroll students in a course
  static async bulkEnrollStudents(studentIds: string[], courseId: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const studentId of studentIds) {
      try {
        const success = await this.enrollStudentInCourse(studentId, courseId);
        if (success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Failed to enroll student ${studentId}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error enrolling student ${studentId}: ${error.message}`);
      }
    }

    return results;
  }

  // Get course statistics for lecturers
  static async getCourseStatistics(courseId: string): Promise<{
    totalStudents: number;
    totalSessions: number;
    averageAttendance: number;
    recentAttendanceTrend: Array<{
      date: string;
      present: number;
      total: number;
      rate: number;
    }>;
  }> {
    try {
      // Get total enrolled students
      const { count: totalStudents } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // Get total sessions
      const { count: totalSessions } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // Get recent sessions (last 10) with attendance data
      const { data: recentSessions } = await supabase
        .from('class_sessions')
        .select('id, session_date')
        .eq('course_id', courseId)
        .order('session_date', { ascending: false })
        .limit(10);

      let totalAttendanceRecords = 0;
      let totalPossibleAttendance = 0;
      const attendanceTrend = [];

      if (recentSessions) {
        for (const session of recentSessions) {
          const { count: presentCount } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('status', 'verified');

          const present = presentCount || 0;
          const total = totalStudents || 0;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;

          attendanceTrend.push({
            date: session.session_date,
            present,
            total,
            rate
          });

          totalAttendanceRecords += present;
          totalPossibleAttendance += total;
        }
      }

      const averageAttendance = totalPossibleAttendance > 0 ? 
        Math.round((totalAttendanceRecords / totalPossibleAttendance) * 100) : 0;

      return {
        totalStudents: totalStudents || 0,
        totalSessions: totalSessions || 0,
        averageAttendance,
        recentAttendanceTrend: attendanceTrend.reverse(), // Show chronologically
      };
    } catch (error) {
      console.error('Error fetching course statistics:', error);
      return {
        totalStudents: 0,
        totalSessions: 0,
        averageAttendance: 0,
        recentAttendanceTrend: [],
      };
    }
  }

  // Check if a student is enrolled in a course
  static async isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return !!data;
    } catch (error) {
      console.error('Error checking student enrollment:', error);
      return false;
    }
  }

  /**
   * Start a new class session
   */
  static async startClassSession(sessionData: {
    courseId: string;
    instructorId: string;
    startTime: string;
    endTime: string;
    location?: string;
    qrCodeActive: boolean;
    beaconEnabled: boolean;
    attendanceWindowMinutes: number;
  }): Promise<ApiResponse<EnhancedClassSession>> {
    try {
      const attendanceWindowStart = new Date(sessionData.startTime);
      const attendanceWindowEnd = new Date(attendanceWindowStart.getTime() + sessionData.attendanceWindowMinutes * 60000);
      
      // Extract time part from ISO timestamp for TIME fields
      const startTimeOnly = new Date(sessionData.startTime).toTimeString().split(' ')[0]; // HH:MM:SS
      const endTimeOnly = new Date(sessionData.endTime).toTimeString().split(' ')[0]; // HH:MM:SS
      
      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          course_id: sessionData.courseId,
          instructor_id: sessionData.instructorId,
          session_date: new Date(sessionData.startTime).toISOString().split('T')[0],
          start_time: startTimeOnly,
          end_time: endTimeOnly,
          location: sessionData.location,
          qr_code_active: sessionData.qrCodeActive,
          qr_code_expires_at: sessionData.qrCodeActive ? attendanceWindowEnd.toISOString() : null,
          beacon_enabled: sessionData.beaconEnabled,
          attendance_window_start: attendanceWindowStart.toISOString(),
          attendance_window_end: attendanceWindowEnd.toISOString(),
          session_type: 'regular'
        })
        .select(`
          *,
          course:courses (
            id,
            name,
            code,
            location
          )
        `)
        .single();

      if (error) throw error;

      return { data: this.mapToEnhancedClassSession(data) };
    } catch (error) {
      console.error('Error starting class session:', error);
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to start class session' 
      };
    }
  }

  /**
   * End a class session
   */
  static async endClassSession(sessionId: string): Promise<ApiResponse<boolean>> {
    try {
      // Extract time part for TIME field
      const endTimeOnly = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      
      const { error } = await supabase
        .from('class_sessions')
        .update({
          qr_code_active: false,
          end_time: endTimeOnly
        })
        .eq('id', sessionId);

      if (error) throw error;

      return { data: true };
    } catch (error) {
      console.error('Error ending class session:', error);
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to end class session' 
      };
    }
  }

  /**
   * Toggle QR code for a session
   */
  static async toggleQRCode(sessionId: string, active: boolean): Promise<ApiResponse<boolean>> {
    try {
      const updateData: any = {
        qr_code_active: active
      };

      if (active) {
        // Set QR code to expire in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60000);
        updateData.qr_code_expires_at = expiresAt.toISOString();
      } else {
        updateData.qr_code_expires_at = null;
      }

      const { error } = await supabase
        .from('class_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;

      return { data: true };
    } catch (error) {
      console.error('Error toggling QR code:', error);
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to toggle QR code' 
      };
    }
  }

  /**
   * Get attendance records for a session
   */
  static async getSessionAttendance(sessionId: string): Promise<ApiResponse<EnhancedAttendanceRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          student:users!attendance_records_student_id_fkey (
            id,
            first_name,
            last_name,
            email,
            student_id
          ),
          session:class_sessions (
            id,
            session_date,
            start_time,
            end_time
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;

      const attendanceRecords = data?.map(record => this.mapToEnhancedAttendanceRecord(record)) || [];
      return { data: attendanceRecords };
    } catch (error) {
      console.error('Error fetching session attendance:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch attendance records' 
      };
    }
  }

  /**
   * Mark attendance manually
   */
  static async markAttendance(sessionId: string, studentId: string, status: 'verified' | 'late' | 'absent'): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          session_id: sessionId,
          student_id: studentId,
          method: 'manual',
          status: status,
          check_in_time: status !== 'absent' ? new Date().toISOString() : null,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'session_id,student_id'
        });

      if (error) throw error;

      return { data: true };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to mark attendance' 
      };
    }
  }

  /**
   * Helper method to map database record to EnhancedClassSession
   */
  private static mapToEnhancedClassSession(data: any): EnhancedClassSession {
    return {
      id: data.id,
      courseId: data.course_id,
      course: data.course ? {
        id: data.course.id,
        code: data.course.code,
        name: data.course.name,
        instructorId: '',
        schoolId: '',
        maxStudents: 0,
        approvalRequired: false,
        instructorName: '',
        location: data.course.location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : undefined,
      instructorId: data.instructor_id,
      sessionDate: data.session_date,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location,
      qrCodeActive: data.qr_code_active,
      qrCodeExpiresAt: data.qr_code_expires_at,
      beaconEnabled: data.beacon_enabled,
      beaconId: data.beacon_id,
      beacon: data.beacon,
      attendanceWindowStart: data.attendance_window_start,
      attendanceWindowEnd: data.attendance_window_end,
      sessionType: data.session_type,
      createdAt: data.created_at
    };
  }

  /**
   * Helper method to map database record to EnhancedAttendanceRecord
   */
  private static mapToEnhancedAttendanceRecord(data: any): EnhancedAttendanceRecord {
    return {
      id: data.id,
      sessionId: data.session_id,
      session: data.session,
      studentId: data.student_id,
      student: data.student ? {
        id: data.student.id,
        email: data.student.email,
        role: 'student' as const,
        firstName: data.student.first_name,
        lastName: data.student.last_name,
        studentId: data.student.student_id,
        approvalStatus: 'approved' as const,
        name: `${data.student.first_name} ${data.student.last_name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : undefined,
      method: data.method,
      status: data.status,
      checkInTime: data.check_in_time,
      latitude: data.latitude,
      longitude: data.longitude,
      deviceInfo: data.device_info,
      verifiedBy: data.verified_by,
      verifiedAt: data.verified_at,
      courseName: data.course_name,
      courseCode: data.course_code,
      date: data.date,
      locationAccuracy: data.location_accuracy,
      createdAt: data.created_at
    };
  }
} 