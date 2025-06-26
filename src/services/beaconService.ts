import { supabase } from '@/lib/supabaseClient';
import { 
  BLEBeacon, 
  CreateBeaconRequest, 
  UpdateBeaconRequest, 
  ApiResponse, 
  PaginatedResponse,
  BeaconFilters
} from '@/types/enhanced';

export class BeaconService {
  /**
   * Create a new BLE beacon
   */
  static async createBeacon(beaconData: CreateBeaconRequest): Promise<ApiResponse<BLEBeacon>> {
    try {
      // Check if beacon UID or MAC address already exists
      const { data: existingBeacon } = await supabase
        .from('ble_beacons')
        .select('id')
        .or(`beacon_uid.eq.${beaconData.beaconUid},mac_address.eq.${beaconData.macAddress}`)
        .limit(1);

      if (existingBeacon && existingBeacon.length > 0) {
        return { 
          data: null as any, 
          error: 'Beacon with this UID or MAC address already exists'
        };
      }

      const { data, error } = await supabase
        .from('ble_beacons')
        .insert({
          beacon_uid: beaconData.beaconUid,
          mac_address: beaconData.macAddress,
          name: beaconData.name,
          school_id: beaconData.schoolId,
          location: beaconData.location,
          status: 'inactive'
        })
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformBeaconFromDB(data),
        message: 'Beacon created successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to create beacon'
      };
    }
  }

  /**
   * Get all beacons with pagination and filters
   */
  static async getAllBeacons(
    page: number = 1,
    pageSize: number = 20,
    filters?: BeaconFilters,
    searchTerm?: string
  ): Promise<PaginatedResponse<BLEBeacon>> {
    try {
      let query = supabase
        .from('ble_beacons')
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.schoolId) {
        query = query.eq('school_id', filters.schoolId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assignedToCourse) {
        if (filters.assignedToCourse === 'unassigned') {
          query = query.is('assigned_to_course', null);
        } else {
          query = query.eq('assigned_to_course', filters.assignedToCourse);
        }
      }

      // Add search filter
      if (searchTerm) {
        query = query.or(`
          name.ilike.%${searchTerm}%,
          beacon_uid.ilike.%${searchTerm}%,
          mac_address.ilike.%${searchTerm}%,
          location.ilike.%${searchTerm}%
        `);
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

      const beacons = data?.map(this.transformBeaconFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: beacons,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch beacons');
    }
  }

  /**
   * Get beacon by ID
   */
  static async getBeaconById(id: string): Promise<ApiResponse<BLEBeacon>> {
    try {
      const { data, error } = await supabase
        .from('ble_beacons')
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformBeaconFromDB(data)
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Beacon not found'
      };
    }
  }

  /**
   * Get beacons by school ID
   */
  static async getBeaconsBySchool(
    schoolId: string,
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<PaginatedResponse<BLEBeacon>> {
    try {
      let query = supabase
        .from('ble_beacons')
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `, { count: 'exact' })
        .eq('school_id', schoolId);

      if (status) {
        query = query.eq('status', status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .range(from, to)
        .order('name');

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const beacons = data?.map(this.transformBeaconFromDB) || [];
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: beacons,
        count: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch school beacons');
    }
  }

  /**
   * Get available beacons for assignment (not assigned to any course)
   */
  static async getAvailableBeacons(schoolId: string): Promise<ApiResponse<BLEBeacon[]>> {
    try {
      const { data, error } = await supabase
        .from('ble_beacons')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('school_id', schoolId)
        .is('assigned_to_course', null)
        .eq('status', 'active')
        .order('name');

      if (error) {
        return { data: [], error: error.message };
      }

      return { 
        data: data?.map(this.transformBeaconFromDB) || []
      };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch available beacons'
      };
    }
  }

  /**
   * Update beacon information
   */
  static async updateBeacon(
    id: string,
    updates: UpdateBeaconRequest
  ): Promise<ApiResponse<BLEBeacon>> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.beaconUid) updateData.beacon_uid = updates.beaconUid;
      if (updates.macAddress) updateData.mac_address = updates.macAddress;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.batteryLevel !== undefined) updateData.battery_level = updates.batteryLevel;
      if (updates.signalStrength !== undefined) updateData.signal_strength = updates.signalStrength;
      if (updates.status) updateData.status = updates.status;
      if (updates.assignedToCourse !== undefined) updateData.assigned_to_course = updates.assignedToCourse;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('ble_beacons')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformBeaconFromDB(data),
        message: 'Beacon updated successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to update beacon'
      };
    }
  }

  /**
   * Assign beacon to course
   */
  static async assignBeaconToCourse(
    beaconId: string,
    courseId: string
  ): Promise<ApiResponse<BLEBeacon>> {
    try {
      // Check if course already has a beacon assigned
      const { data: existingBeacon } = await supabase
        .from('ble_beacons')
        .select('id, name')
        .eq('assigned_to_course', courseId)
        .limit(1);

      if (existingBeacon && existingBeacon.length > 0) {
        return { 
          data: null as any, 
          error: `Course already has beacon "${existingBeacon[0].name}" assigned`
        };
      }

      const { data, error } = await supabase
        .from('ble_beacons')
        .update({
          assigned_to_course: courseId,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', beaconId)
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformBeaconFromDB(data),
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
   * Unassign beacon from course
   */
  static async unassignBeaconFromCourse(beaconId: string): Promise<ApiResponse<BLEBeacon>> {
    try {
      const { data, error } = await supabase
        .from('ble_beacons')
        .update({
          assigned_to_course: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', beaconId)
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformBeaconFromDB(data),
        message: 'Beacon unassigned from course successfully'
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to unassign beacon'
      };
    }
  }

  /**
   * Delete beacon
   */
  static async deleteBeacon(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Check if beacon is assigned to any course
      const { data: beacon } = await supabase
        .from('ble_beacons')
        .select('assigned_to_course')
        .eq('id', id)
        .single();

      if (beacon?.assigned_to_course) {
        return { 
          data: false, 
          error: 'Cannot delete beacon that is assigned to a course. Please unassign first.'
        };
      }

      const { error } = await supabase
        .from('ble_beacons')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: false, error: error.message };
      }

      return { 
        data: true,
        message: 'Beacon deleted successfully'
      };
    } catch (error) {
      return { 
        data: false, 
        error: error instanceof Error ? error.message : 'Failed to delete beacon'
      };
    }
  }

  /**
   * Update beacon battery status (for monitoring)
   */
  static async updateBeaconBattery(
    beaconId: string,
    batteryLevel: number,
    signalStrength?: number
  ): Promise<ApiResponse<BLEBeacon>> {
    try {
      const updateData: any = {
        battery_level: batteryLevel,
        updated_at: new Date().toISOString()
      };

      if (signalStrength !== undefined) {
        updateData.signal_strength = signalStrength;
      }

      // Auto-update status based on battery level
      if (batteryLevel <= 10) {
        updateData.status = 'maintenance';
      } else if (batteryLevel <= 20) {
        // Keep current status but could trigger notification
      }

      const { data, error } = await supabase
        .from('ble_beacons')
        .update(updateData)
        .eq('id', beaconId)
        .select(`
          *,
          school:schools(*),
          course:courses!assigned_to_course(*)
        `)
        .single();

      if (error) {
        return { data: null as any, error: error.message };
      }

      return { 
        data: this.transformBeaconFromDB(data)
      };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to update beacon battery'
      };
    }
  }

  /**
   * Get beacon statistics by school
   */
  static async getBeaconStats(schoolId?: string): Promise<ApiResponse<Record<string, number>>> {
    try {
      let query = supabase
        .from('ble_beacons')
        .select('status, assigned_to_course');

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null as any, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        active: data?.filter(b => b.status === 'active').length || 0,
        inactive: data?.filter(b => b.status === 'inactive').length || 0,
        maintenance: data?.filter(b => b.status === 'maintenance').length || 0,
        lost: data?.filter(b => b.status === 'lost').length || 0,
        assigned: data?.filter(b => b.assigned_to_course).length || 0,
        available: data?.filter(b => !b.assigned_to_course).length || 0
      };

      return { data: stats };
    } catch (error) {
      return { 
        data: null as any, 
        error: error instanceof Error ? error.message : 'Failed to fetch beacon statistics'
      };
    }
  }

  /**
   * Transform database beacon object to frontend interface
   */
  private static transformBeaconFromDB(dbBeacon: any): BLEBeacon {
    return {
      id: dbBeacon.id,
      beaconUid: dbBeacon.beacon_uid,
      macAddress: dbBeacon.mac_address,
      name: dbBeacon.name,
      schoolId: dbBeacon.school_id,
      school: dbBeacon.school ? {
        id: dbBeacon.school.id,
        name: dbBeacon.school.name,
        code: dbBeacon.school.code,
        address: dbBeacon.school.address,
        contactEmail: dbBeacon.school.contact_email,
        contactPhone: dbBeacon.school.contact_phone,
        logoUrl: dbBeacon.school.logo_url,
        timezone: dbBeacon.school.timezone,
        status: dbBeacon.school.status,
        createdAt: dbBeacon.school.created_at,
        updatedAt: dbBeacon.school.updated_at
      } : undefined,
      location: dbBeacon.location,
      batteryLevel: dbBeacon.battery_level,
      signalStrength: dbBeacon.signal_strength,
      status: dbBeacon.status,
      assignedToCourse: dbBeacon.assigned_to_course,
      course: dbBeacon.course ? {
        id: dbBeacon.course.id,
        code: dbBeacon.course.code,
        name: dbBeacon.course.name,
        description: dbBeacon.course.description,
        instructorId: dbBeacon.course.instructor_id,
        location: dbBeacon.course.location,
        schedule: dbBeacon.course.schedule,
        schoolId: dbBeacon.course.school_id,
        department: dbBeacon.course.department,
        semester: dbBeacon.course.semester,
        academicYear: dbBeacon.course.academic_year,
        maxStudents: dbBeacon.course.max_students,
        beaconId: dbBeacon.course.beacon_id,
        approvalRequired: dbBeacon.course.approval_required,
        instructorName: dbBeacon.course.instructor,
        room: dbBeacon.course.room,
        beaconMacAddress: dbBeacon.course.beacon_mac_address,
        startTime: dbBeacon.course.start_time,
        endTime: dbBeacon.course.end_time,
        days: dbBeacon.course.days,
        attendanceRate: dbBeacon.course.attendance_rate,
        locationCoordinates: dbBeacon.course.location_coordinates,
        createdAt: dbBeacon.course.created_at,
        updatedAt: dbBeacon.course.updated_at
      } : undefined,
      createdAt: dbBeacon.created_at,
      updatedAt: dbBeacon.updated_at
    };
  }
} 