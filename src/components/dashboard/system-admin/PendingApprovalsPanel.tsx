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
  AlertTriangle,
  AlertCircle
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
  const [processingUsers, setProcessingUsers] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setProcessingUsers(prev => [...prev, userId]);
      setError(null);
      setSuccessMessage(null);
      
      const approval: ApprovalRequest = {
        status: 'approved',
        reviewNotes: notes || 'Approved by system administrator'
      };
      
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage('User approved successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadPendingApprovals();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setProcessingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleRejectUser = async (userId: string, notes?: string) => {
    try {
      setProcessingUsers(prev => [...prev, userId]);
      setError(null);
      setSuccessMessage(null);
      
      const approval: ApprovalRequest = {
        status: 'rejected',
        reviewNotes: notes || 'Registration rejected by system administrator'
      };
      
      const response = await UserService.approveUser(userId, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        setSuccessMessage('User rejected successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        await loadPendingApprovals();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user');
    } finally {
      setProcessingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkApprove = async (status: 'approved' | 'rejected') => {
    if (selectedUsers.length === 0) return;

    try {
      setBulkProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      const approval: ApprovalRequest = {
        status,
        reviewNotes: reviewNotes || (status === 'approved' ? 'Bulk approved by system administrator' : 'Bulk rejected by system administrator')
      };

      const response = await UserService.bulkApproveUsers(selectedUsers, approval, user.id);
      if (response.error) {
        setError(response.error);
      } else {
        const statusText = status === 'approved' ? 'approved' : 'rejected';
        setSuccessMessage(`${selectedUsers.length} users ${statusText} successfully`);
        setTimeout(() => setSuccessMessage(null), 3000);
        setSelectedUsers([]);
        setReviewNotes('');
        await loadPendingApprovals();
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk approval');
    } finally {
      setBulkProcessing(false);
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
      case 'student': return 'bg-blue-900/30 text-blue-300 border-blue-400';
      case 'lecturer': return 'bg-green-900/30 text-green-300 border-green-400';
      case 'admin': return 'bg-purple-900/30 text-purple-300 border-purple-400';
      case 'head_lecturer': return 'bg-orange-900/30 text-orange-300 border-orange-400';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {successMessage && (
        <Alert className="bg-green-900/20 border-green-500/50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-300">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pending User Approvals</h2>
          <p className="text-gray-400">Review and approve user registrations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800">
            {pendingUsers.length} pending
          </Badge>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">
                  {selectedUsers.length} user(s) selected
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])} className="text-gray-300 hover:bg-gray-700">
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
                  disabled={bulkProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {bulkProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {bulkProcessing ? 'Processing...' : 'Approve Selected'}
                </Button>
                <Button
                  onClick={() => handleBulkApprove('rejected')}
                  disabled={bulkProcessing}
                  variant="destructive"
                >
                  {bulkProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  {bulkProcessing ? 'Processing...' : 'Reject Selected'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading pending approvals...</span>
        </div>
      ) : pendingUsers.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-4 text-lg font-medium text-white">No pending approvals</h3>
              <p className="text-gray-400">All user registrations have been reviewed.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2 p-3 border border-gray-600 rounded-lg bg-gray-800">
            <Checkbox
              checked={selectedUsers.length === pendingUsers.length && pendingUsers.length > 0}
              disabled={bulkProcessing}
              onCheckedChange={selectAllUsers}
            />
            <Label className="font-medium text-white">
              Select all ({pendingUsers.length} users)
            </Label>
          </div>

          {/* Users List */}
          {pendingUsers.map((pendingUser) => (
            <Card key={pendingUser.id} className="hover:shadow-lg transition-shadow bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedUsers.includes(pendingUser.id)}
                    disabled={processingUsers.includes(pendingUser.id) || bulkProcessing}
                    onCheckedChange={() => toggleUserSelection(pendingUser.id)}
                  />
                  
                  <div className="flex-1 space-y-3">
                    {/* User Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-lg text-white">
                          {pendingUser.firstName} {pendingUser.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
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
                        <Badge variant="outline" className={getRoleColor(pendingUser.role)}>
                          {pendingUser.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="border-yellow-500/50 bg-yellow-900/20 text-yellow-300">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                      {pendingUser.studentId && (
                        <div>
                          <span className="font-medium text-white">Student ID:</span> {pendingUser.studentId}
                        </div>
                      )}
                      {pendingUser.employeeId && (
                        <div>
                          <span className="font-medium text-white">Employee ID:</span> {pendingUser.employeeId}
                        </div>
                      )}
                      {pendingUser.department && (
                        <div>
                          <span className="font-medium text-white">Department:</span> {pendingUser.department}
                        </div>
                      )}
                      {pendingUser.school && (
                        <div className="flex items-center space-x-1">
                          <SchoolIcon className="h-4 w-4 text-gray-400" />
                          <span>{pendingUser.school.name}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-white">Registered:</span> {new Date(pendingUser.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleRejectUser(pendingUser.id)}
                        disabled={processingUsers.includes(pendingUser.id) || bulkProcessing}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 bg-red-900/10 disabled:opacity-50"
                      >
                        {processingUsers.includes(pendingUser.id) ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4" />
                        )}
                        {processingUsers.includes(pendingUser.id) ? 'Processing...' : 'Reject'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(pendingUser.id)}
                        disabled={processingUsers.includes(pendingUser.id) || bulkProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      >
                        {processingUsers.includes(pendingUser.id) ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1 h-4 w-4" />
                        )}
                        {processingUsers.includes(pendingUser.id) ? 'Processing...' : 'Approve'}
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
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
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