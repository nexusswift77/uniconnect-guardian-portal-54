// Enhanced TypeScript interfaces for UniConnect Admin Dashboard
// These interfaces map directly to our database schema

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedUser {
  id: string;
  email: string;
  role: 'student' | 'lecturer' | 'admin' | 'head_lecturer' | 'system_admin';
  firstName: string;
  lastName: string;
  studentId?: string;
  phone?: string;
  schoolId?: string;
  school?: School;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  department?: string;
  employeeId?: string;
  name: string; // Computed field for mobile compatibility
  deviceId?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BLEBeacon {
  id: string;
  beaconUid: string;
  macAddress: string;
  name: string;
  schoolId: string;
  school?: School;
  location?: string;
  batteryLevel?: number;
  signalStrength?: number;
  status: 'active' | 'inactive' | 'maintenance' | 'lost';
  assignedToCourse?: string;
  course?: EnhancedCourse;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedCourse {
  id: string;
  code: string;
  name: string;
  description?: string;
  instructorId: string;
  instructor?: EnhancedUser;
  location?: string;
  schedule?: any;
  schoolId: string;
  school?: School;
  department?: string;
  semester?: string;
  academicYear?: string;
  maxStudents: number;
  beaconId?: string;
  beacon?: BLEBeacon;
  approvalRequired: boolean;
  // Mobile app compatibility fields
  instructorName: string;
  room?: string;
  beaconMacAddress?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
  attendanceRate?: number;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollmentRequest {
  id: string;
  studentId: string;
  student?: EnhancedUser;
  courseId: string;
  course?: EnhancedCourse;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewer?: EnhancedUser;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface SchoolMembershipRequest {
  id: string;
  studentId: string;
  student?: EnhancedUser;
  schoolId: string;
  school?: School;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewer?: EnhancedUser;
  reviewedAt?: string;
  reviewNotes?: string;
  studentIdDocument?: string;
}

export interface EnhancedClassSession {
  id: string;
  courseId: string;
  course?: EnhancedCourse;
  instructorId: string;
  instructor?: EnhancedUser;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  qrCodeActive: boolean;
  qrCodeExpiresAt?: string;
  beaconEnabled: boolean;
  beaconId?: string;
  beacon?: BLEBeacon;
  attendanceWindowStart?: string;
  attendanceWindowEnd?: string;
  sessionType: 'regular' | 'makeup' | 'exam' | 'lab';
  createdAt: string;
}

export interface EnhancedAttendanceRecord {
  id: string;
  sessionId: string;
  session?: EnhancedClassSession;
  studentId: string;
  student?: EnhancedUser;
  method: 'BLE' | 'QR' | 'manual';
  status: 'verified' | 'pending' | 'absent' | 'late';
  checkInTime?: string;
  latitude?: number;
  longitude?: number;
  deviceInfo?: any;
  verifiedBy?: string;
  verifier?: EnhancedUser;
  verifiedAt?: string;
  courseName: string;
  courseCode: string;
  date: string;
  locationAccuracy?: number;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types for creating/updating entities
export interface CreateSchoolRequest {
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  timezone?: string;
}

export interface UpdateSchoolRequest extends Partial<CreateSchoolRequest> {
  status?: 'active' | 'inactive' | 'suspended';
}

export interface CreateBeaconRequest {
  beaconUid: string;
  macAddress: string;
  name: string;
  schoolId: string;
  location?: string;
}

export interface UpdateBeaconRequest extends Partial<CreateBeaconRequest> {
  batteryLevel?: number;
  signalStrength?: number;
  status?: 'active' | 'inactive' | 'maintenance' | 'lost';
  assignedToCourse?: string;
}

export interface ApprovalRequest {
  status: 'approved' | 'rejected';
  reviewNotes?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  totalUsers: number;
  pendingApprovals: number;
  totalBeacons: number;
  activeBeacons: number;
  totalCourses: number;
  todayAttendance: number;
}

export interface SchoolStats {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  activeBeacons: number;
  attendanceRate: number;
  pendingRequests: number;
}

// Filter and search types
export interface UserFilters {
  role?: string;
  schoolId?: string;
  approvalStatus?: string;
  department?: string;
}

export interface BeaconFilters {
  schoolId?: string;
  status?: string;
  assignedToCourse?: string;
}

export interface CourseFilters {
  schoolId?: string;
  instructorId?: string;
  department?: string;
  semester?: string;
} 