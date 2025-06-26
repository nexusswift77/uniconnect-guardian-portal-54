import React, { useState, useEffect } from 'react';
import { EnhancedUser } from '@/types/enhanced';
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
  Filter,
  Loader2,
  School as SchoolIcon,
  Mail,
  Phone
} from 'lucide-react';

interface SystemUserManagementProps {
  user: EnhancedUser;
  onUpdate: () => void;
}

const SystemUserManagement: React.FC<SystemUserManagementProps> = ({ user, onUpdate }) => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        role: roleFilter !== 'all' ? roleFilter as any : undefined,
        approvalStatus: statusFilter !== 'all' ? statusFilter as any : undefined
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

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      if (newStatus === 'pending') {
        // For pending status, we'd need a different approach or skip this action
        setError('Cannot set status back to pending');
        return;
      }
      
      const approval = {
        status: newStatus as 'approved' | 'rejected',
        reviewNotes: `Status changed to ${newStatus} by system admin`
      };
      
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        loadUsers();
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
      case 'system_admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System User Management</h2>
          <p className="text-muted-foreground">Manage all users across all schools</p>
        </div>
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
            <SelectItem value="system_admin">System Admins</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
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
        <div className="space-y-4">
          {users.map((systemUser) => (
            <Card key={systemUser.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium text-lg">
                          {systemUser.firstName} {systemUser.lastName}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{systemUser.email}</span>
                        </div>
                      </div>
                      <Badge className={getRoleColor(systemUser.role)}>
                        {systemUser.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      {systemUser.school && (
                        <div className="flex items-center space-x-1">
                          <SchoolIcon className="h-4 w-4" />
                          <span>{systemUser.school.name}</span>
                        </div>
                      )}
                      {systemUser.studentId && (
                        <div>
                          <span className="font-medium">Student ID:</span> {systemUser.studentId}
                        </div>
                      )}
                      {systemUser.employeeId && (
                        <div>
                          <span className="font-medium">Employee ID:</span> {systemUser.employeeId}
                        </div>
                      )}
                      {systemUser.department && (
                        <div>
                          <span className="font-medium">Department:</span> {systemUser.department}
                        </div>
                      )}
                      {systemUser.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{systemUser.phone}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Joined:</span> {new Date(systemUser.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={systemUser.approvalStatus}
                      onValueChange={(value: 'approved' | 'rejected' | 'pending') => 
                        handleStatusChange(systemUser.id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <Badge variant={getStatusColor(systemUser.approvalStatus)}>
                          {systemUser.approvalStatus}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

export default SystemUserManagement; 