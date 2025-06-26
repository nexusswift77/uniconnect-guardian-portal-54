import { supabase } from '@/lib/supabaseClient';
import { 
  SchoolMembershipRequest, 
  CourseEnrollmentRequest, 
  ApiResponse, 
  PaginatedResponse,
  ApprovalRequest
} from '@/types/enhanced';

export class ApprovalService {
  /**
   * Get all school membership requests with pagination
   */
  static async getSchoolMembershipRequests(
    page: number = 1,
    pageSize: number = 20,
    schoolId?: string,
    status?: string
  ): Promise<PaginatedResponse<SchoolMembershipRequest>> {
    try {
      let query = supabase
        .from('school_membership_requests')
        .select(`
          *,
          student:users!student_id(*),
          school:schools(*),
          reviewer:users!reviewed_by(first_name, last_name, email)
        `, { count: 'exact' });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('requested_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const requests = data?.map(this.transformMembershipRequestFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: requests,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch membership requests');
    }
  }

  /**
   * Get all course enrollment requests with pagination
   */
  static async getCourseEnrollmentRequests(
    page: number = 1,
    pageSize: number = 20,
    courseId?: string,
    schoolId?: string,
    status?: string
  ): Promise<PaginatedResponse<CourseEnrollmentRequest>> {
    try {
      let query = supabase
        .from('course_enrollment_requests')
        .select(`
          *,
          student:users!student_id(*),
          course:courses(*),
          reviewer:users!reviewed_by(first_name, last_name, email)
        `, { count: 'exact' });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Filter by school if provided
      if (schoolId) {
        // First get courses in the school
        const { data: schoolCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('school_id', schoolId);

        if (schoolCourses) {
          const courseIds = schoolCourses.map(c => c.id);
          query = query.in('course_id', courseIds);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('requested_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const requests = data?.map(this.transformEnrollmentRequestFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: requests,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch enrollment requests');
    }
  }

  /**
   * Get pending requests for a specific school
   */
  static async getPendingRequestsBySchool(schoolId: string): Promise<ApiResponse<{
    membershipRequests: SchoolMembershipRequest[];
    enrollmentRequests: CourseEnrollmentRequest[];
    totalPending: number;
  }>> {
    try {
      // Get pending membership requests
      const { data: membershipData } = await supabase
        .from('school_membership_requests')
        .select(`
          *,
          student:users!student_id(*),
          school:schools(*)
        `)
        .eq('school_id', schoolId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      // Get pending enrollment requests for courses in this school
      const { data: schoolCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('school_id', schoolId);

      let enrollmentData = [];
      if (schoolCourses && schoolCourses.length > 0) {
        const courseIds = schoolCourses.map(c => c.id);
        const { data } = await supabase
          .from('course_enrollment_requests')
          .select(`
            *,
            student:users!student_id(*),
            course:courses(*)
          `)
          .in('course_id', courseIds)
          .eq('status', 'pending')
          .order('requested_at', { ascending: true });
        
        enrollmentData = data || [];
      }

      const membershipRequests = membershipData?.map(this.transformMembershipRequestFromDB) || [];
      const enrollmentRequests = enrollmentData.map(this.transformEnrollmentRequestFromDB);

      return {
        data: {
          membershipRequests,
          enrollmentRequests,
          totalPending: membershipRequests.length + enrollmentRequests.length
        }
      };
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Failed to fetch pending requests'
      };
    }
  }

  /**
   * Approve or reject school membership request
   */
  static async processSchoolMembershipRequest(
    requestId: string,
    approval: ApprovalRequest,
    reviewerId: string
  ): Promise<ApiResponse<SchoolMembershipRequest>> {
    try {
      // Update the request
      const { data: requestData, error: requestError } = await supabase
        .from('school_membership_requests')
        .update({
          status: approval.status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: approval.reviewNotes
        })
        .eq('id', requestId)
        .select(`
          *,
          student:users!student_id(*),
          school:schools(*),
          reviewer:users!reviewed_by(first_name, last_name, email)
        `)
        .single();

      if (requestError) {
        return { data: null as any, error: requestError.message };
      }

      // If approved, update user's school_id and approval_status
      if (approval.status === 'approved') {
        await supabase
          .from('users')
          .update({
            school_id: requestData.school_id,
            approval_status: 'approved',
            approved_by: reviewerId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.student_id);

        // Create approval notification
        await supabase
          .from('notifications')
          .insert({
            user_id: requestData.student_id,
            title: 'School Membership Approved',
            message: `Your membership request for ${requestData.school?.name} has been approved.`,
            type: 'approval',
            timestamp: new Date().toISOString()
          });
      } else {
        // Create rejection notification
        await supabase
          .from('notifications')
          .insert({
            user_id: requestData.student_id,
            title: 'School Membership Rejected',
            message: approval.reviewNotes || `Your membership request for ${requestData.school?.name} has been rejected.`,
            type: 'rejection',
            timestamp: new Date().toISOString()
          });
      }

      return {
        data: this.transformMembershipRequestFromDB(requestData),
        message: `Membership request ${approval.status} successfully`
      };
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Failed to process membership request'
      };
    }
  }

  /**
   * Approve or reject course enrollment request
   */
  static async processCourseEnrollmentRequest(
    requestId: string,
    approval: ApprovalRequest,
    reviewerId: string
  ): Promise<ApiResponse<CourseEnrollmentRequest>> {
    try {
      // Update the request
      const { data: requestData, error: requestError } = await supabase
        .from('course_enrollment_requests')
        .update({
          status: approval.status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: approval.reviewNotes
        })
        .eq('id', requestId)
        .select(`
          *,
          student:users!student_id(*),
          course:courses(*),
          reviewer:users!reviewed_by(first_name, last_name, email)
        `)
        .single();

      if (requestError) {
        return { data: null as any, error: requestError.message };
      }

      // If approved, create course enrollment
      if (approval.status === 'approved') {
        // Check if enrollment already exists
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('student_id', requestData.student_id)
          .eq('course_id', requestData.course_id)
          .limit(1);

        if (!existingEnrollment || existingEnrollment.length === 0) {
          await supabase
            .from('course_enrollments')
            .insert({
              student_id: requestData.student_id,
              course_id: requestData.course_id,
              enrolled_at: new Date().toISOString()
            });
        }

        // Create approval notification
        await supabase
          .from('notifications')
          .insert({
            user_id: requestData.student_id,
            title: 'Course Enrollment Approved',
            message: `Your enrollment request for ${requestData.course?.name} has been approved.`,
            type: 'approval',
            timestamp: new Date().toISOString()
          });
      } else {
        // Create rejection notification
        await supabase
          .from('notifications')
          .insert({
            user_id: requestData.student_id,
            title: 'Course Enrollment Rejected',
            message: approval.reviewNotes || `Your enrollment request for ${requestData.course?.name} has been rejected.`,
            type: 'rejection',
            timestamp: new Date().toISOString()
          });
      }

      return {
        data: this.transformEnrollmentRequestFromDB(requestData),
        message: `Enrollment request ${approval.status} successfully`
      };
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Failed to process enrollment request'
      };
    }
  }

  /**
   * Bulk approve membership requests
   */
  static async bulkApproveMembershipRequests(
    requestIds: string[],
    approval: ApprovalRequest,
    reviewerId: string
  ): Promise<ApiResponse<number>> {
    try {
      // Update all requests
      const { data: requests, error: requestError } = await supabase
        .from('school_membership_requests')
        .update({
          status: approval.status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: approval.reviewNotes
        })
        .in('id', requestIds)
        .select('student_id, school_id');

      if (requestError) {
        return { data: 0, error: requestError.message };
      }

      if (approval.status === 'approved' && requests) {
        // Update users' school_id and approval_status
        const studentIds = requests.map(r => r.student_id);
        const schoolId = requests[0]?.school_id;

        await supabase
          .from('users')
          .update({
            school_id: schoolId,
            approval_status: 'approved',
            approved_by: reviewerId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', studentIds);

        // Create notifications
        const notifications = studentIds.map(studentId => ({
          user_id: studentId,
          title: 'School Membership Approved',
          message: 'Your school membership request has been approved.',
          type: 'approval',
          timestamp: new Date().toISOString()
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return {
        data: requests?.length || 0,
        message: `${requests?.length || 0} membership requests ${approval.status} successfully`
      };
    } catch (error) {
      return {
        data: 0,
        error: error instanceof Error ? error.message : 'Failed to process bulk membership requests'
      };
    }
  }

  /**
   * Bulk approve enrollment requests
   */
  static async bulkApproveEnrollmentRequests(
    requestIds: string[],
    approval: ApprovalRequest,
    reviewerId: string
  ): Promise<ApiResponse<number>> {
    try {
      // Update all requests
      const { data: requests, error: requestError } = await supabase
        .from('course_enrollment_requests')
        .update({
          status: approval.status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          review_notes: approval.reviewNotes
        })
        .in('id', requestIds)
        .select('student_id, course_id');

      if (requestError) {
        return { data: 0, error: requestError.message };
      }

      if (approval.status === 'approved' && requests) {
        // Create course enrollments
        const enrollments = requests.map(r => ({
          student_id: r.student_id,
          course_id: r.course_id,
          enrolled_at: new Date().toISOString()
        }));

        // Use upsert to avoid duplicates
        await supabase
          .from('course_enrollments')
          .upsert(enrollments, {
            onConflict: 'student_id, course_id'
          });

        // Create notifications
        const notifications = requests.map(r => ({
          user_id: r.student_id,
          title: 'Course Enrollment Approved',
          message: 'Your course enrollment request has been approved.',
          type: 'approval',
          timestamp: new Date().toISOString()
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return {
        data: requests?.length || 0,
        message: `${requests?.length || 0} enrollment requests ${approval.status} successfully`
      };
    } catch (error) {
      return {
        data: 0,
        error: error instanceof Error ? error.message : 'Failed to process bulk enrollment requests'
      };
    }
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStats(schoolId?: string): Promise<ApiResponse<{
    membershipRequests: Record<string, number>;
    enrollmentRequests: Record<string, number>;
    totalPending: number;
  }>> {
    try {
      // Get membership request stats
      let membershipQuery = supabase
        .from('school_membership_requests')
        .select('status');

      if (schoolId) {
        membershipQuery = membershipQuery.eq('school_id', schoolId);
      }

      const { data: membershipData } = await membershipQuery;

      // Get enrollment request stats
      let enrollmentQuery = supabase
        .from('course_enrollment_requests')
        .select('status, course_id');

      if (schoolId) {
        const { data: schoolCourses } = await supabase
          .from('courses')
          .select('id')
          .eq('school_id', schoolId);

        if (schoolCourses) {
          const courseIds = schoolCourses.map(c => c.id);
          enrollmentQuery = enrollmentQuery.in('course_id', courseIds);
        }
      }

      const { data: enrollmentData } = await enrollmentQuery;

      // Calculate stats
      const membershipStats = {};
      membershipData?.forEach(req => {
        membershipStats[req.status] = (membershipStats[req.status] || 0) + 1;
      });

      const enrollmentStats = {};
      enrollmentData?.forEach(req => {
        enrollmentStats[req.status] = (enrollmentStats[req.status] || 0) + 1;
      });

      const totalPending = (membershipStats['pending'] || 0) + (enrollmentStats['pending'] || 0);

      return {
        data: {
          membershipRequests: membershipStats,
          enrollmentRequests: enrollmentStats,
          totalPending
        }
      };
    } catch (error) {
      return {
        data: null as any,
        error: error instanceof Error ? error.message : 'Failed to fetch approval statistics'
      };
    }
  }

  /**
   * Transform database membership request object to frontend interface
   */
  private static transformMembershipRequestFromDB(dbRequest: any): SchoolMembershipRequest {
    return {
      id: dbRequest.id,
      studentId: dbRequest.student_id,
      student: dbRequest.student ? {
        id: dbRequest.student.id,
        email: dbRequest.student.email,
        role: dbRequest.student.role,
        firstName: dbRequest.student.first_name,
        lastName: dbRequest.student.last_name,
        studentId: dbRequest.student.student_id,
        phone: dbRequest.student.phone,
        schoolId: dbRequest.student.school_id,
        approvalStatus: dbRequest.student.approval_status,
        approvedBy: dbRequest.student.approved_by,
        approvedAt: dbRequest.student.approved_at,
        department: dbRequest.student.department,
        employeeId: dbRequest.student.employee_id,
        name: `${dbRequest.student.first_name} ${dbRequest.student.last_name}`,
        deviceId: dbRequest.student.device_id,
        profileImage: dbRequest.student.profile_image,
        createdAt: dbRequest.student.created_at,
        updatedAt: dbRequest.student.updated_at
      } : undefined,
      schoolId: dbRequest.school_id,
      school: dbRequest.school ? {
        id: dbRequest.school.id,
        name: dbRequest.school.name,
        code: dbRequest.school.code,
        address: dbRequest.school.address,
        contactEmail: dbRequest.school.contact_email,
        contactPhone: dbRequest.school.contact_phone,
        logoUrl: dbRequest.school.logo_url,
        timezone: dbRequest.school.timezone,
        status: dbRequest.school.status,
        createdAt: dbRequest.school.created_at,
        updatedAt: dbRequest.school.updated_at
      } : undefined,
      status: dbRequest.status,
      requestedAt: dbRequest.requested_at,
      reviewedBy: dbRequest.reviewed_by,
      reviewer: dbRequest.reviewer ? {
        id: dbRequest.reviewer.id,
        email: dbRequest.reviewer.email,
        role: 'admin',
        firstName: dbRequest.reviewer.first_name,
        lastName: dbRequest.reviewer.last_name,
        name: `${dbRequest.reviewer.first_name} ${dbRequest.reviewer.last_name}`,
        approvalStatus: 'approved',
        createdAt: '',
        updatedAt: ''
      } : undefined,
      reviewedAt: dbRequest.reviewed_at,
      reviewNotes: dbRequest.review_notes,
      studentIdDocument: dbRequest.student_id_document
    };
  }

  /**
   * Transform database enrollment request object to frontend interface
   */
  private static transformEnrollmentRequestFromDB(dbRequest: any): CourseEnrollmentRequest {
    return {
      id: dbRequest.id,
      studentId: dbRequest.student_id,
      student: dbRequest.student ? {
        id: dbRequest.student.id,
        email: dbRequest.student.email,
        role: dbRequest.student.role,
        firstName: dbRequest.student.first_name,
        lastName: dbRequest.student.last_name,
        studentId: dbRequest.student.student_id,
        phone: dbRequest.student.phone,
        schoolId: dbRequest.student.school_id,
        approvalStatus: dbRequest.student.approval_status,
        approvedBy: dbRequest.student.approved_by,
        approvedAt: dbRequest.student.approved_at,
        department: dbRequest.student.department,
        employeeId: dbRequest.student.employee_id,
        name: `${dbRequest.student.first_name} ${dbRequest.student.last_name}`,
        deviceId: dbRequest.student.device_id,
        profileImage: dbRequest.student.profile_image,
        createdAt: dbRequest.student.created_at,
        updatedAt: dbRequest.student.updated_at
      } : undefined,
      courseId: dbRequest.course_id,
      course: dbRequest.course ? {
        id: dbRequest.course.id,
        code: dbRequest.course.code,
        name: dbRequest.course.name,
        description: dbRequest.course.description,
        instructorId: dbRequest.course.instructor_id,
        location: dbRequest.course.location,
        schedule: dbRequest.course.schedule,
        schoolId: dbRequest.course.school_id,
        department: dbRequest.course.department,
        semester: dbRequest.course.semester,
        academicYear: dbRequest.course.academic_year,
        maxStudents: dbRequest.course.max_students,
        beaconId: dbRequest.course.beacon_id,
        approvalRequired: dbRequest.course.approval_required,
        instructorName: dbRequest.course.instructor_name,
        room: dbRequest.course.room,
        beaconMacAddress: dbRequest.course.beacon_mac_address,
        startTime: dbRequest.course.start_time,
        endTime: dbRequest.course.end_time,
        days: dbRequest.course.days,
        attendanceRate: dbRequest.course.attendance_rate,
        locationCoordinates: dbRequest.course.location_coordinates,
        createdAt: dbRequest.course.created_at,
        updatedAt: dbRequest.course.updated_at
      } : undefined,
      status: dbRequest.status,
      requestedAt: dbRequest.requested_at,
      reviewedBy: dbRequest.reviewed_by,
      reviewer: dbRequest.reviewer ? {
        id: dbRequest.reviewer.id,
        email: dbRequest.reviewer.email,
        role: 'admin',
        firstName: dbRequest.reviewer.first_name,
        lastName: dbRequest.reviewer.last_name,
        name: `${dbRequest.reviewer.first_name} ${dbRequest.reviewer.last_name}`,
        approvalStatus: 'approved',
        createdAt: '',
        updatedAt: ''
      } : undefined,
      reviewedAt: dbRequest.reviewed_at,
      reviewNotes: dbRequest.review_notes
    };
  }
} 