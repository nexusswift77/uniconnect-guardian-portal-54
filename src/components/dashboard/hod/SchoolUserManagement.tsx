import React, { useState, useEffect } from 'react';
import { EnhancedUser, School, ApprovalRequest } from '@/types/enhanced';
import { UserService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Users, 
  GraduationCap, 
  UserCheck, 
  UserX,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface SchoolUserManagementProps {
  user: EnhancedUser;
  school: School | null;
  onUpdate: () => void;
}

const SchoolUserManagement: React.FC<SchoolUserManagementProps> = ({ user, school, onUpdate }) => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (school) {
      if (activeTab === 'active') {
        loadSchoolUsers();
      } else {
        loadPendingUsers();
      }
    }
  }, [school, currentPage, searchTerm, roleFilter, statusFilter, activeTab]);

  const loadSchoolUsers = async () => {
    if (!school) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        schoolId: school.id,
        role: roleFilter !== 'all' ? roleFilter as any : undefined,
        approvalStatus: 'approved' as const // Only show approved users in active tab
      };
      
      const response = await UserService.getAllUsers(
        currentPage,
        20,
        filters,
        searchTerm
      );
      
      setUsers(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingUsers = async () => {
    if (!school) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await UserService.getPendingApprovals(school.id, currentPage, 20);
      setPendingUsers(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const approval: ApprovalRequest = {
        status: 'approved',
        reviewNotes: 'Approved by Head of Department'
      };
      
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        loadPendingUsers();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const approval: ApprovalRequest = {
        status: 'rejected',
        reviewNotes: 'Rejected by Head of Department'
      };
      
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        loadPendingUsers();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const approval: ApprovalRequest = {
        status: newStatus,
        reviewNotes: `Status changed to ${newStatus} by HOD`
      };
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        loadSchoolUsers();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'lecturer': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'head_lecturer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  const renderActiveUsers = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">No users match your current filters.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        users.map((schoolUser) => (
          <Card key={schoolUser.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-medium text-lg">
                        {schoolUser.firstName} {schoolUser.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{schoolUser.email}</p>
                    </div>
                    <Badge className={getRoleColor(schoolUser.role)}>
                      {schoolUser.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {schoolUser.studentId && (
                      <div>
                        <span className="font-medium">Student ID:</span> {schoolUser.studentId}
                      </div>
                    )}
                    {schoolUser.employeeId && (
                      <div>
                        <span className="font-medium">Employee ID:</span> {schoolUser.employeeId}
                      </div>
                    )}
                    {schoolUser.department && (
                      <div>
                        <span className="font-medium">Department:</span> {schoolUser.department}
                      </div>
                    )}
                    {schoolUser.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {schoolUser.phone}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Joined:</span> {new Date(schoolUser.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {new Date(schoolUser.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(schoolUser.approvalStatus)}>
                    {schoolUser.approvalStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderPendingUsers = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading pending users...</span>
        </div>
      ) : pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-medium">No pending approvals</h3>
              <p className="text-muted-foreground">All user registrations have been reviewed.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        pendingUsers.map((pendingUser) => (
          <Card key={pendingUser.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-medium text-lg">
                        {pendingUser.firstName} {pendingUser.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                    </div>
                    <Badge className={getRoleColor(pendingUser.role)}>
                      {pendingUser.role.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {pendingUser.studentId && (
                      <div>
                        <span className="font-medium">Student ID:</span> {pendingUser.studentId}
                      </div>
                    )}
                    {pendingUser.employeeId && (
                      <div>
                        <span className="font-medium">Employee ID:</span> {pendingUser.employeeId}
                      </div>
                    )}
                    {pendingUser.department && (
                      <div>
                        <span className="font-medium">Department:</span> {pendingUser.department}
                      </div>
                    )}
                    {pendingUser.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {pendingUser.phone}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Registered:</span> {new Date(pendingUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleRejectUser(pendingUser.id)}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveUser(pendingUser.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (!school) {
    return (
      <Alert>
        <AlertDescription>School information is not available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">School Users</h2>
          <p className="text-muted-foreground">Manage users in {school.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="inline mr-2 h-4 w-4" />
            Active Users
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="inline mr-2 h-4 w-4" />
            Pending Approvals
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingUsers.length}
              </Badge>
            )}
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {activeTab === 'active' && (
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="lecturer">Lecturers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="head_lecturer">HODs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Content */}
      {activeTab === 'active' ? renderActiveUsers() : renderPendingUsers()}

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
          <span className="flex items-center px-3">
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SchoolUserManagement; 