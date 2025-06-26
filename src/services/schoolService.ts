import { supabase } from '@/lib/supabaseClient';
import { 
  School, 
  CreateSchoolRequest, 
  UpdateSchoolRequest, 
  ApiResponse, 
  PaginatedResponse,
  SchoolStats,
  DashboardStats
} from '@/types/enhanced';

export class SchoolService {
  /**
   * Create a new school (System Admin only)
   */
  static async createSchool(schoolData: CreateSchoolRequest): Promise<ApiResponse<School>> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: schoolData.name,
          code: schoolData.code,
          address: schoolData.address,
          contact_email: schoolData.contactEmail,
          contact_phone: schoolData.contactPhone,
          logo_url: schoolData.logoUrl,
          timezone: schoolData.timezone || 'UTC',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformSchoolFromDB(data),
        message: 'School created successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all schools with pagination
   */
  static async getAllSchools(
    page: number = 1, 
    pageSize: number = 20,
    searchTerm?: string
  ): Promise<PaginatedResponse<School>> {
    try {
      let query = supabase
        .from('schools')
        .select('*', { count: 'exact' });

      // Add search filter if provided
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('name');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const schools = data?.map(this.transformSchoolFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: schools,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch schools');
    }
  }

  /**
   * Get school by ID
   */
  static async getSchoolById(id: string): Promise<ApiResponse<School>> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformSchoolFromDB(data)
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'School not found'
      };
    }
  }

  /**
   * Update school
   */
  static async updateSchool(id: string, updates: UpdateSchoolRequest): Promise<ApiResponse<School>> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.code) updateData.code = updates.code;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
      if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
      if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
      if (updates.timezone) updateData.timezone = updates.timezone;
      if (updates.status) updateData.status = updates.status;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('schools')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformSchoolFromDB(data),
        message: 'School updated successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to update school'
      };
    }
  }

  /**
   * Delete school (System Admin only)
   */
  static async deleteSchool(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Check if school has any users, courses, or beacons
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('school_id', id)
        .limit(1);

      if (users && users.length > 0) {
        return { 
          data: false, 
          error: 'Cannot delete school with existing users. Please transfer or remove users first.'
        };
      }

      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: false, error: error.message };
      }

      return { 
        data: true,
        message: 'School deleted successfully'
      };
    } catch (error) {
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to delete school'
      };
    }
  }

  /**
   * Get school statistics
   */
  static async getSchoolStats(schoolId: string): Promise<ApiResponse<SchoolStats>> {
    try {
      // Get school info
      const { data: school } = await supabase
        .from('schools')
        .select('name')
        .eq('id', schoolId)
        .single();

      if (!school) {
        return { data: null as any, error: 'School not found' };
      }

      // Get user counts
      const { data: students } = await supabase
        .from('users')
        .select('id')
        .eq('school_id', schoolId)
        .eq('role', 'student');

      const { data: lecturers } = await supabase
        .from('users')
        .select('id')
        .eq('school_id', schoolId)
        .in('role', ['lecturer', 'admin', 'head_lecturer']);

      // Get course count
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('school_id', schoolId);

      // Get active beacon count
      const { data: beacons } = await supabase
        .from('ble_beacons')
        .select('id')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      // Get pending requests count
      const { data: membershipRequests } = await supabase
        .from('school_membership_requests')
        .select('id')
        .eq('school_id', schoolId)
        .eq('status', 'pending');

      const { data: enrollmentRequests } = await supabase
        .from('course_enrollment_requests')
        .select('id')
        .eq('status', 'pending')
        .in('course_id', courses?.map(c => c.id) || []);

      // Calculate attendance rate (simplified - last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: totalSessions } = await supabase
        .from('class_sessions')
        .select('id')
        .in('course_id', courses?.map(c => c.id) || [])
        .gte('session_date', thirtyDaysAgo.toISOString());

      const { data: attendedSessions } = await supabase
        .from('attendance_records')
        .select('id')
        .in('session_id', totalSessions?.map(s => s.id) || [])
        .eq('status', 'verified');

      const attendanceRate = totalSessions?.length 
        ? Math.round((attendedSessions?.length || 0) / totalSessions.length * 100)
        : 0;

      const stats: SchoolStats = {
        schoolId,
        schoolName: school.name,
        totalStudents: students?.length || 0,
        totalLecturers: lecturers?.length || 0,
        totalCourses: courses?.length || 0,
        activeBeacons: beacons?.length || 0,
        attendanceRate,
        pendingRequests: (membershipRequests?.length || 0) + (enrollmentRequests?.length || 0)
      };

      return { data: stats };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to fetch school statistics'
      };
    }
  }

  /**
   * Get system-wide dashboard statistics (System Admin only)
   */
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      // Get school counts
      const { data: allSchools } = await supabase
        .from('schools')
        .select('status');

      const totalSchools = allSchools?.length || 0;
      const activeSchools = allSchools?.filter(s => s.status === 'active').length || 0;

      // Get total users
      const { data: users } = await supabase
        .from('users')
        .select('id, approval_status');

      const totalUsers = users?.length || 0;
      const pendingApprovals = users?.filter(u => u.approval_status === 'pending').length || 0;

      // Get beacon counts
      const { data: beacons } = await supabase
        .from('ble_beacons')
        .select('status');

      const totalBeacons = beacons?.length || 0;
      const activeBeacons = beacons?.filter(b => b.status === 'active').length || 0;

      // Get total courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id');

      const totalCourses = courses?.length || 0;

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('attendance_records')
        .select('id')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      const stats: DashboardStats = {
        totalSchools,
        activeSchools,
        totalUsers,
        pendingApprovals,
        totalBeacons,
        activeBeacons,
        totalCourses,
        todayAttendance: todayAttendance?.length || 0
      };

      return { data: stats };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics'
      };
    }
  }

  /**
   * Transform database school object to frontend interface
   */
  private static transformSchoolFromDB(dbSchool: any): School {
    return {
      id: dbSchool.id,
      name: dbSchool.name,
      code: dbSchool.code,
      address: dbSchool.address,
      contactEmail: dbSchool.contact_email,
      contactPhone: dbSchool.contact_phone,
      logoUrl: dbSchool.logo_url,
      timezone: dbSchool.timezone,
      status: dbSchool.status,
      createdAt: dbSchool.created_at,
      updatedAt: dbSchool.updated_at
    };
  }
} 