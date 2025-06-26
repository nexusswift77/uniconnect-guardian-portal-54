import React, { useState, useEffect } from 'react';
import { EnhancedUser, ApprovalRequest } from '@/types/enhanced';
import { UserService, ApprovalService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  School as SchoolIcon,
  Users,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface PendingApprovalsPanelProps {
  user: EnhancedUser;
  onUpdate: () => void;
}

const PendingApprovalsPanel: React.FC<PendingApprovalsPanelProps> = ({ user, onUpdate }) => {
  const [pendingUsers, setPendingUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPendingApprovals();
  }, [currentPage]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await UserService.getPendingApprovals(undefined, currentPage, 20);
      setPendingUsers(response.data);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, notes?: string) => {
    try {
      const approval: ApprovalRequest = {
        status: 'approved',
        reviewNotes: notes
      };
      
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        loadPendingApprovals();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string, notes?: string) => {
    try {
      const approval: ApprovalRequest = {
        status: 'rejected',
        reviewNotes: notes || 'Registration rejected by system administrator'
      };
      
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        loadPendingApprovals();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    }
  };

  const handleBulkApprove = async (status: 'approved' | 'rejected') => {
    if (selectedUsers.length === 0) return;

    try {
      const approval: ApprovalRequest = {
        status,
        reviewNotes: reviewNotes || (status === 'approved' ? 'Bulk approved by system administrator' : 'Bulk rejected by system administrator')
      };

      const response = await UserService.bulkApproveUsers(selectedUsers, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        setSelectedUsers([]);
        setReviewNotes('');
        loadPendingApprovals();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk approval');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === pendingUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(pendingUsers.map(u => u.id));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending User Approvals</h2>
          <p className="text-muted-foreground">Review and approve user registrations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {pendingUsers.length} pending
          </Badge>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                  Clear selection
                </Button>
              </div>
              
              <div>
                <Label htmlFor="bulk-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="bulk-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes for the bulk action..."
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleBulkApprove('approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Selected
                </Button>
                <Button
                  onClick={() => handleBulkApprove('rejected')}
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading pending approvals...</span>
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
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
            <Checkbox
              checked={selectedUsers.length === pendingUsers.length && pendingUsers.length > 0}
              onCheckedChange={selectAllUsers}
            />
            <Label className="font-medium">
              Select all ({pendingUsers.length} users)
            </Label>
          </div>

          {/* Users List */}
          {pendingUsers.map((pendingUser) => (
            <Card key={pendingUser.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedUsers.includes(pendingUser.id)}
                    onCheckedChange={() => toggleUserSelection(pendingUser.id)}
                  />
                  
                  <div className="flex-1 space-y-3">
                    {/* User Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg">
                          {pendingUser.firstName} {pendingUser.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{pendingUser.email}</span>
                          </div>
                          {pendingUser.phone && (
                            <span>📞 {pendingUser.phone}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleColor(pendingUser.role)}>
                          {pendingUser.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                      {pendingUser.school && (
                        <div className="flex items-center space-x-1">
                          <SchoolIcon className="h-4 w-4" />
                          <span>{pendingUser.school.name}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Registered:</span> {new Date(pendingUser.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
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
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PendingApprovalsPanel; 