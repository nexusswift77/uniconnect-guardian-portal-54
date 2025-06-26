import { supabase } from '@/lib/supabaseClient';
import { 
  EnhancedCourse, 
  ApiResponse, 
  PaginatedResponse,
  CourseFilters
} from '@/types/enhanced';

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(courseData: Partial<EnhancedCourse>): Promise<ApiResponse<EnhancedCourse>> {
    try {
      // Check if course code already exists in the school
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('code', courseData.code)
        .eq('school_id', courseData.schoolId)
        .limit(1);

      if (existingCourse && existingCourse.length > 0) {
        return { 
          data: null as any, 
          error: 'Course code already exists in this school'
        };
      }

      // If a beacon is assigned, check if it's available
      if (courseData.beaconId) {
        const { data: beacon } = await supabase
          .from('ble_beacons')
          .select('id, assigned_to_course, status')
          .eq('id', courseData.beaconId)
          .single();

        if (!beacon) {
          return { 
            data: null as any, 
            error: 'Selected beacon not found'
          };
        }

        if (beacon.assigned_to_course) {
          return { 
            data: null as any, 
            error: 'Selected beacon is already assigned to another course'
          };
        }

        if (beacon.status !== 'active') {
          return { 
            data: null as any, 
            error: 'Selected beacon is not active'
          };
        }
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          code: courseData.code,
          name: courseData.name,
          description: courseData.description,
          instructor_id: courseData.instructorId,
          location: courseData.location,
          schedule: courseData.schedule,
          school_id: courseData.schoolId,
          department: courseData.department,
          semester: courseData.semester,
          academic_year: courseData.academicYear,
          max_students: courseData.maxStudents || 50,
          beacon_id: courseData.beaconId,
          approval_required: courseData.approvalRequired || true,
          // Mobile app compatibility fields
          instructor: courseData.instructorName,
          room: courseData.room,
          beacon_mac_address: courseData.beaconMacAddress,
          start_time: courseData.startTime,
          end_time: courseData.endTime,
          days: courseData.days,
          location_coordinates: courseData.locationCoordinates
        })
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      // If a beacon was assigned, update the beacon's assigned_to_course field
      if (courseData.beaconId && data) {
        const { error: beaconUpdateError } = await supabase
          .from('ble_beacons')
          .update({ 
            assigned_to_course: data.id,
            status: 'active' // Ensure beacon is active when assigned
          })
          .eq('id', courseData.beaconId);

        if (beaconUpdateError) {
          console.error('Failed to update beacon assignment:', beaconUpdateError);
          // Note: We don't return error here as the course was created successfully
          // The beacon assignment can be fixed later
        }
      }

      return { 
        data: this.transformCourseFromDB(data),
        message: 'Course created successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to create course'
      };
    }
  }

  /**
   * Get all courses with pagination and filters
   */
  static async getAllCourses(
    page: number = 1,
    pageSize: number = 20,
    filters?: CourseFilters,
    searchTerm?: string
  ): Promise<PaginatedResponse<EnhancedCourse>> {
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.schoolId) {
        query = query.eq('school_id', filters.schoolId);
      }
      if (filters?.instructorId) {
        query = query.eq('instructor_id', filters.instructorId);
      }
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.semester) {
        query = query.eq('semester', filters.semester);
      }

      // Add search filter
      if (searchTerm) {
        query = query.or(`
          code.ilike.%${searchTerm}%,
          name.ilike.%${searchTerm}%,
          description.ilike.%${searchTerm}%,
          department.ilike.%${searchTerm}%
        `);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('code');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const courses = data?.map(this.transformCourseFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: courses,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch courses');
    }
  }

  /**
   * Get course by ID
   */
  static async getCourseById(id: string): Promise<ApiResponse<EnhancedCourse>> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformCourseFromDB(data)
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Course not found'
      };
    }
  }

  /**
   * Get courses by school ID
   */
  static async getCoursesBySchool(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20,
    instructorId?: string
  ): Promise<PaginatedResponse<EnhancedCourse>> {
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `, { count: 'exact' })
        .eq('school_id', schoolId);

      if (instructorId) {
        query = query.eq('instructor_id', instructorId);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('code');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const courses = data?.map(this.transformCourseFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: courses,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch school courses');
    }
  }

  /**
   * Get courses by instructor ID
   */
  static async getCoursesByInstructor(
    instructorId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<EnhancedCourse>> {
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `, { count: 'exact' })
        .eq('instructor_id', instructorId);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('code');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const courses = data?.map(this.transformCourseFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: courses,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch instructor courses');
    }
  }

  /**
   * Update course information
   */
  static async updateCourse(
    id: string,
    updates: Partial<EnhancedCourse>
  ): Promise<ApiResponse<EnhancedCourse>> {
    try {
      // Get current course data to check for beacon changes
      const { data: currentCourse } = await supabase
        .from('courses')
        .select('beacon_id')
        .eq('id', id)
        .single();

      if (!currentCourse) {
        return { data: null as any, error: 'Course not found' };
      }

      const oldBeaconId = currentCourse.beacon_id;
      const newBeaconId = updates.beaconId !== undefined ? updates.beaconId : oldBeaconId;

      // If beacon is being changed, validate the new beacon
      if (updates.beaconId !== undefined && updates.beaconId !== oldBeaconId) {
        if (newBeaconId) {
          const { data: beacon } = await supabase
            .from('ble_beacons')
            .select('id, assigned_to_course, status')
            .eq('id', newBeaconId)
            .single();

          if (!beacon) {
            return { 
              data: null as any, 
              error: 'Selected beacon not found'
            };
          }

          if (beacon.assigned_to_course && beacon.assigned_to_course !== id) {
            return { 
              data: null as any, 
              error: 'Selected beacon is already assigned to another course'
            };
          }

          if (beacon.status !== 'active') {
            return { 
              data: null as any, 
              error: 'Selected beacon is not active'
            };
          }
        }
      }

      const updateData: any = {};
      
      if (updates.code) updateData.code = updates.code;
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.instructorId) updateData.instructor_id = updates.instructorId;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.schedule !== undefined) updateData.schedule = updates.schedule;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.semester !== undefined) updateData.semester = updates.semester;
      if (updates.academicYear !== undefined) updateData.academic_year = updates.academicYear;
      if (updates.maxStudents !== undefined) updateData.max_students = updates.maxStudents;
      if (updates.beaconId !== undefined) updateData.beacon_id = updates.beaconId;
      if (updates.approvalRequired !== undefined) updateData.approval_required = updates.approvalRequired;
      
      // Mobile app compatibility fields
      if (updates.instructorName !== undefined) updateData.instructor = updates.instructorName;
      if (updates.room !== undefined) updateData.room = updates.room;
      if (updates.beaconMacAddress !== undefined) updateData.beacon_mac_address = updates.beaconMacAddress;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.days !== undefined) updateData.days = updates.days;
      if (updates.locationCoordinates !== undefined) updateData.location_coordinates = updates.locationCoordinates;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      // Handle beacon assignment changes
      if (updates.beaconId !== undefined && newBeaconId !== oldBeaconId) {
        // Unassign old beacon if it exists
        if (oldBeaconId) {
          await supabase
            .from('ble_beacons')
            .update({ 
              assigned_to_course: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', oldBeaconId);
        }

        // Assign new beacon if it exists
        if (newBeaconId) {
          await supabase
            .from('ble_beacons')
            .update({ 
              assigned_to_course: id,
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', newBeaconId);
        }
      }

      return { 
        data: this.transformCourseFromDB(data),
        message: 'Course updated successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to update course'
      };
    }
  }

  /**
   * Delete course
   */
  static async deleteCourse(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Get course data to check for beacon assignment
      const { data: course } = await supabase
        .from('courses')
        .select('beacon_id')
        .eq('id', id)
        .single();

      if (!course) {
        return { 
          data: false, 
          error: 'Course not found'
        };
      }

      // Check for dependencies (class sessions, enrollments, etc.)
      const { data: sessions } = await supabase
        .from('class_sessions')
        .select('id')
        .eq('course_id', id)
        .limit(1);

      if (sessions && sessions.length > 0) {
        return { 
          data: false, 
          error: 'Cannot delete course with existing class sessions'
        };
      }

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', id)
        .limit(1);

      if (enrollments && enrollments.length > 0) {
        return { 
          data: false, 
          error: 'Cannot delete course with existing enrollments'
        };
      }

      // If course has a beacon assigned, unassign it before deleting
      if (course.beacon_id) {
        await supabase
          .from('ble_beacons')
          .update({ 
            assigned_to_course: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', course.beacon_id);
      }

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: false, error: error.message };
      }

      return { 
        data: true,
        message: 'Course deleted successfully'
      };
    } catch (error) {
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to delete course'
      };
    }
  }

  /**
   * Assign beacon to course
   */
  static async assignBeacon(courseId: string, beaconId: string): Promise<ApiResponse<EnhancedCourse>> {
    try {
      // Update course with beacon
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .update({
          beacon_id: beaconId,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `)
        .single();

      if (courseError) {
        return { data: null as any, error: courseError.message };
      }

      // Update beacon assignment
      await supabase
        .from('ble_beacons')
        .update({
          assigned_to_course: courseId,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', beaconId);

      return { 
        data: this.transformCourseFromDB(courseData),
        message: 'Beacon assigned to course successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to assign beacon'
      };
    }
  }

  /**
   * Remove beacon from course
   */
  static async removeBeacon(courseId: string): Promise<ApiResponse<EnhancedCourse>> {
    try {
      // Get current beacon ID
      const { data: course } = await supabase
        .from('courses')
        .select('beacon_id')
        .eq('id', courseId)
        .single();

      // Update course to remove beacon
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .update({
          beacon_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select(`
          *,
          instructor:users!instructor_id(*),
          school:schools(*),
          beacon:ble_beacons!beacon_id(*)
        `)
        .single();

      if (courseError) {
        return { data: null as any, error: courseError.message };
      }

      // Update beacon to remove assignment
      if (course?.beacon_id) {
        await supabase
          .from('ble_beacons')
          .update({
            assigned_to_course: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', course.beacon_id);
      }

      return { 
        data: this.transformCourseFromDB(courseData),
        message: 'Beacon removed from course successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to remove beacon'
      };
    }
  }

  /**
   * Get course enrollment count
   */
  static async getCourseEnrollmentCount(courseId: string): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId);

      if (error) {
        return { data: 0, error: error.message };
      }

      return { data: data?.length || 0 };
    } catch (error) {
      return { 
        data: 0, 
        error: error instanceof Error ? error.message : 'Failed to get enrollment count'
      };
    }
  }

  /**
   * Get course statistics
   */
  static async getCourseStats(schoolId?: string): Promise<ApiResponse<{
    total: number;
    byDepartment: Record<string, number>;
    bySemester: Record<string, number>;
  }>> {
    try {
      let query = supabase
        .from('courses')
        .select('id, department, semester');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null as any, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        byDepartment: {} as Record<string, number>,
        bySemester: {} as Record<string, number>
      };

      // Count by department
      data?.forEach(course => {
        if (course.department) {
          stats.byDepartment[course.department] = (stats.byDepartment[course.department] || 0) + 1;
        }
        if (course.semester) {
          stats.bySemester[course.semester] = (stats.bySemester[course.semester] || 0) + 1;
        }
      });

      return { data: stats };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to fetch course statistics'
      };
    }
  }

  /**
   * Transform database course object to frontend interface
   */
  private static transformCourseFromDB(dbCourse: any): EnhancedCourse {
    return {
      id: dbCourse.id,
      code: dbCourse.code,
      name: dbCourse.name,
      description: dbCourse.description,
      instructorId: dbCourse.instructor_id,
      instructor: dbCourse.instructor ? {
        id: dbCourse.instructor.id,
        email: dbCourse.instructor.email,
        role: dbCourse.instructor.role,
        firstName: dbCourse.instructor.first_name,
        lastName: dbCourse.instructor.last_name,
        studentId: dbCourse.instructor.student_id,
        phone: dbCourse.instructor.phone,
        schoolId: dbCourse.instructor.school_id,
        approvalStatus: dbCourse.instructor.approval_status,
        approvedBy: dbCourse.instructor.approved_by,
        approvedAt: dbCourse.instructor.approved_at,
        department: dbCourse.instructor.department,
        employeeId: dbCourse.instructor.employee_id,
        name: `${dbCourse.instructor.first_name} ${dbCourse.instructor.last_name}`,
        deviceId: dbCourse.instructor.device_id,
        profileImage: dbCourse.instructor.profile_image,
        createdAt: dbCourse.instructor.created_at,
        updatedAt: dbCourse.instructor.updated_at
      } : undefined,
      location: dbCourse.location,
      schedule: dbCourse.schedule,
      schoolId: dbCourse.school_id,
      school: dbCourse.school ? {
        id: dbCourse.school.id,
        name: dbCourse.school.name,
        code: dbCourse.school.code,
        address: dbCourse.school.address,
        contactEmail: dbCourse.school.contact_email,
        contactPhone: dbCourse.school.contact_phone,
        logoUrl: dbCourse.school.logo_url,
        timezone: dbCourse.school.timezone,
        status: dbCourse.school.status,
        createdAt: dbCourse.school.created_at,
        updatedAt: dbCourse.school.updated_at
      } : undefined,
      department: dbCourse.department,
      semester: dbCourse.semester,
      academicYear: dbCourse.academic_year,
      maxStudents: dbCourse.max_students,
      beaconId: dbCourse.beacon_id,
      beacon: dbCourse.beacon ? {
        id: dbCourse.beacon.id,
        beaconUid: dbCourse.beacon.beacon_uid,
        macAddress: dbCourse.beacon.mac_address,
        name: dbCourse.beacon.name,
        schoolId: dbCourse.beacon.school_id,
        location: dbCourse.beacon.location,
        batteryLevel: dbCourse.beacon.battery_level,
        signalStrength: dbCourse.beacon.signal_strength,
        status: dbCourse.beacon.status,
        assignedToCourse: dbCourse.beacon.assigned_to_course,
        createdAt: dbCourse.beacon.created_at,
        updatedAt: dbCourse.beacon.updated_at
      } : undefined,
      approvalRequired: dbCourse.approval_required,
      // Mobile app compatibility fields
      instructorName: dbCourse.instructor,
      room: dbCourse.room,
      beaconMacAddress: dbCourse.beacon_mac_address,
      startTime: dbCourse.start_time,
      endTime: dbCourse.end_time,
      days: dbCourse.days,
      attendanceRate: dbCourse.attendance_rate,
      locationCoordinates: dbCourse.location_coordinates,
      createdAt: dbCourse.created_at,
      updatedAt: dbCourse.updated_at
    };
  }
} 