import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { 
  EnhancedUser, 
  ApiResponse, 
  PaginatedResponse,
  UserFilters,
  ApprovalRequest
} from '@/types/enhanced';

export class UserService {
  /**
   * Get all users with pagination and filters
   */
  static async getAllUsers(
    page: number = 1,
    pageSize: number = 20,
    filters?: UserFilters,
    searchTerm?: string
  ): Promise<PaginatedResponse<EnhancedUser>> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.schoolId) {
        query = query.eq('school_id', filters.schoolId);
      }
      if (filters?.approvalStatus) {
        query = query.eq('approval_status', filters.approvalStatus);
      }
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }

      // Add search filter
      if (searchTerm) {
        query = query.or(`
          first_name.ilike.%${searchTerm}%,
          last_name.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%,
          student_id.ilike.%${searchTerm}%,
          employee_id.ilike.%${searchTerm}%
        `);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const users = data?.map(this.transformUserFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: users,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  /**
   * Get user by ID with school information
   */
  static async getUserById(id: string): Promise<ApiResponse<EnhancedUser>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          school:schools(*),
          approver:users!approved_by(first_name, last_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformUserFromDB(data)
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'User not found'
      };
    }
  }

  /**
   * Get users by school ID
   */
  static async getUsersBySchool(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20,
    role?: string
  ): Promise<PaginatedResponse<EnhancedUser>> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `, { count: 'exact' })
        .eq('school_id', schoolId);

      if (role) {
        query = query.eq('role', role);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const users = data?.map(this.transformUserFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: users,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch school users');
    }
  }

  /**
   * Get users by school ID for HOD management (restricted to students and lecturers only)
   */
  static async getUsersBySchoolForHOD(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20,
    role?: string
  ): Promise<PaginatedResponse<EnhancedUser>> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .in('role', ['student', 'lecturer']); // HODs can only manage students and lecturers

      if (role && ['student', 'lecturer'].includes(role)) {
        query = query.eq('role', role);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const users = data?.map(this.transformUserFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: users,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch school users for HOD');
    }
  }

  /**
   * Get pending user approvals
   */
  static async getPendingApprovals(
    schoolId?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<EnhancedUser>> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `, { count: 'exact' })
        .eq('approval_status', 'pending');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const users = data?.map(this.transformUserFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: users,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pending approvals');
    }
  }

  /**
   * Get pending user approvals for HOD (restricted to students and lecturers only)
   */
  static async getPendingApprovalsForHOD(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<EnhancedUser>> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `, { count: 'exact' })
        .eq('approval_status', 'pending')
        .eq('school_id', schoolId)
        .in('role', ['student', 'lecturer']); // HODs can only approve students and lecturers

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const users = data?.map(this.transformUserFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: users,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch pending approvals for HOD');
    }
  }

  /**
   * Approve or reject user registration
   */
  static async approveUser(
    userId: string,
    approval: ApprovalRequest,
    approverId: string
  ): Promise<ApiResponse<EnhancedUser>> {
    try {
      // First, get the approver's role to check permissions
      const { data: approver } = await supabase
        .from('users')
        .select('role, school_id')
        .eq('id', approverId)
        .single();

      // Get the user being approved to check their role
      const { data: userToApprove } = await supabase
        .from('users')
        .select('role, school_id')
        .eq('id', userId)
        .single();

      if (!approver || !userToApprove) {
        return { 
          data: null as any, 
          error: 'User or approver not found'
        };
      }

      // If approver is HOD, restrict what they can approve
      if (approver.role === 'head_lecturer') {
        if (!['student', 'lecturer'].includes(userToApprove.role)) {
          return { 
            data: null as any, 
            error: 'Heads of Department can only approve students and lecturers'
          };
        }
        if (approver.school_id !== userToApprove.school_id) {
          return { 
            data: null as any, 
            error: 'You can only approve users from your own school'
          };
        }
      }

      // Use admin client for the update to bypass RLS
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          approval_status: approval.status,
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        return { data: null as any, error: updateError.message };
      }

      // Get the updated user data with school information
      const { data: userData, error: fetchError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('id', userId)
        .single();

      if (fetchError || !userData) {
        return { data: null as any, error: 'User updated but could not fetch updated data' };
      }

      // If approved, create notification
      if (approval.status === 'approved') {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Registration Approved',
            message: 'Your registration has been approved. You can now access the system.',
            type: 'approval',
            timestamp: new Date().toISOString()
          });
      } else {
        // If rejected, create notification with reason
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Registration Rejected',
            message: approval.reviewNotes || 'Your registration has been rejected.',
            type: 'rejection',
            timestamp: new Date().toISOString()
          });
      }

      return { 
        data: this.transformUserFromDB(userData),
        message: `User ${approval.status} successfully`
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to process approval'
      };
    }
  }

  /**
   * Update user information
   */
  static async updateUser(
    userId: string,
    updates: Partial<EnhancedUser>
  ): Promise<ApiResponse<EnhancedUser>> {
    try {
      const updateData: any = {};
      
      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName) updateData.last_name = updates.lastName;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.role) updateData.role = updates.role;
      if (updates.department !== undefined) updateData.department = updates.department;
      if (updates.employeeId !== undefined) updateData.employee_id = updates.employeeId;
      if (updates.studentId !== undefined) updateData.student_id = updates.studentId;
      if (updates.schoolId) updateData.school_id = updates.schoolId;
      if (updates.profileImage !== undefined) updateData.profile_image = updates.profileImage;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select(`
          *,
          school:schools(*)
        `);

      if (error) {
        return { data: null as any, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null as any, error: 'User not found or could not be updated' };
      }

      return { 
        data: this.transformUserFromDB(data[0]),
        message: 'User updated successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to update user'
      };
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<ApiResponse<boolean>> {
    try {
      // Check for dependencies (courses, attendance records, etc.)
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', userId)
        .limit(1);

      if (courses && courses.length > 0) {
        return { 
          data: false, 
          error: 'Cannot delete user with assigned courses. Please reassign courses first.'
        };
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        return { data: false, error: error.message };
      }

      return { 
        data: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to delete user'
      };
    }
  }

  /**
   * Get user statistics by role
   */
  static async getUserStatsByRole(schoolId?: string): Promise<ApiResponse<Record<string, number>>> {
    try {
      let query = supabase
        .from('users')
        .select('role');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null as any, error: error.message };
      }

      const stats: Record<string, number> = {};
      data?.forEach(user => {
        stats[user.role] = (stats[user.role] || 0) + 1;
      });

      return { data: stats };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to fetch user statistics'
      };
    }
  }

  /**
   * Get user statistics by role for HOD (restricted to students and lecturers only)
   */
  static async getUserStatsByRoleForHOD(schoolId: string): Promise<ApiResponse<Record<string, number>>> {
    try {
      let query = supabase
        .from('users')
        .select('role')
        .eq('school_id', schoolId)
        .in('role', ['student', 'lecturer']); // HODs can only see stats for students and lecturers

      const { data, error } = await query;

      if (error) {
        return { data: null as any, error: error.message };
      }

      const stats: Record<string, number> = {};
      data?.forEach(user => {
        stats[user.role] = (stats[user.role] || 0) + 1;
      });

      return { data: stats };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to fetch user statistics for HOD'
      };
    }
  }

  /**
   * Bulk approve users
   */
  static async bulkApproveUsers(
    userIds: string[],
    approval: ApprovalRequest,
    approverId: string
  ): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          approval_status: approval.status,
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)
        .select('id');

      if (error) {
        return { data: 0, error: error.message };
      }

      // Create notifications for all users
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: approval.status === 'approved' ? 'Registration Approved' : 'Registration Rejected',
        message: approval.status === 'approved' 
          ? 'Your registration has been approved. You can now access the system.'
          : approval.reviewNotes || 'Your registration has been rejected.',
        type: approval.status === 'approved' ? 'approval' : 'rejection',
        timestamp: new Date().toISOString()
      }));

      await supabaseAdmin
        .from('notifications')
        .insert(notifications);

      return { 
        data: data?.length || 0,
        message: `${data?.length || 0} users ${approval.status} successfully`
      };
    } catch (error) {
      return { 
        data: 0, 
        error: error instanceof Error ? error.message : 'Failed to process bulk approval'
      };
    }
  }

  /**
   * Transform database user object to frontend interface
   */
  private static transformUserFromDB(dbUser: any): EnhancedUser {
    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      studentId: dbUser.student_id,
      phone: dbUser.phone,
      schoolId: dbUser.school_id,
      school: dbUser.school ? {
        id: dbUser.school.id,
        name: dbUser.school.name,
        code: dbUser.school.code,
        address: dbUser.school.address,
        contactEmail: dbUser.school.contact_email,
        contactPhone: dbUser.school.contact_phone,
        logoUrl: dbUser.school.logo_url,
        timezone: dbUser.school.timezone,
        status: dbUser.school.status,
        createdAt: dbUser.school.created_at,
        updatedAt: dbUser.school.updated_at
      } : undefined,
      approvalStatus: dbUser.approval_status,
      approvedBy: dbUser.approved_by,
      approvedAt: dbUser.approved_at,
      department: dbUser.department,
      employeeId: dbUser.employee_id,
      name: `${dbUser.first_name} ${dbUser.last_name}`, // Computed field
      deviceId: dbUser.device_id,
      profileImage: dbUser.profile_image,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }
} 