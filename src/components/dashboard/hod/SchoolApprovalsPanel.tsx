import React, { useState, useEffect } from 'react';
import { EnhancedUser, CourseEnrollmentRequest, SchoolMembershipRequest } from '@/types/enhanced';
import { ApprovalService, UserService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  GraduationCap,
  BookOpen,
  School,
  Calendar
} from 'lucide-react';

interface SchoolApprovalsPanelProps {
  user: EnhancedUser;
}

const SchoolApprovalsPanel: React.FC<SchoolApprovalsPanelProps> = ({ user }) => {
  const [enrollmentRequests, setEnrollmentRequests] = useState<CourseEnrollmentRequest[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<SchoolMembershipRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    request: CourseEnrollmentRequest | SchoolMembershipRequest | null;
    type: 'enrollment' | 'membership';
  }>({ open: false, request: null, type: 'enrollment' });
  const [reviewNotes, setReviewNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRequests();
  }, [user.schoolId, currentPage, statusFilter]);

  const loadRequests = async () => {
    if (!user.schoolId) return;
    
    try {
      setLoading(true);
      
      // Load enrollment requests for courses in this school
      const enrollmentResponse = await ApprovalService.getCourseEnrollmentRequests(
        currentPage,
        20,
        undefined, // courseId - get all courses in school
        user.schoolId,
        statusFilter === 'all' ? undefined : statusFilter as any
      );
      setEnrollmentRequests(enrollmentResponse.data);

      // Load school membership requests
      const membershipResponse = await ApprovalService.getSchoolMembershipRequests(
        currentPage,
        20,
        user.schoolId,
        statusFilter === 'all' ? undefined : statusFilter as any
      );
      setMembershipRequests(membershipResponse.data);

      // Set total pages based on the larger dataset
      setTotalPages(Math.max(enrollmentResponse.totalPages, membershipResponse.totalPages));

    } catch (error) {
      console.error('Error loading approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (
    requestId: string, 
    type: 'enrollment' | 'membership',
    notes?: string
  ) => {
    try {
      if (type === 'enrollment') {
        await ApprovalService.reviewCourseEnrollmentRequest(requestId, {
          status: 'approved',
          reviewNotes: notes
        });
      } else {
        await ApprovalService.reviewSchoolMembershipRequest(requestId, {
          status: 'approved',
          reviewNotes: notes
        });
      }
      
      loadRequests();
      setReviewDialog({ open: false, request: null, type: 'enrollment' });
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (
    requestId: string, 
    type: 'enrollment' | 'membership',
    notes?: string
  ) => {
    try {
      if (type === 'enrollment') {
        await ApprovalService.reviewCourseEnrollmentRequest(requestId, {
          status: 'rejected',
          reviewNotes: notes
        });
      } else {
        await ApprovalService.reviewSchoolMembershipRequest(requestId, {
          status: 'rejected',
          reviewNotes: notes
        });
      }
      
      loadRequests();
      setReviewDialog({ open: false, request: null, type: 'enrollment' });
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleBulkApproval = async (approve: boolean) => {
    if (selectedRequests.length === 0) return;

    try {
      setLoading(true);
      const promises = selectedRequests.map(async (requestId) => {
        // Determine if this is an enrollment or membership request
        const isEnrollment = enrollmentRequests.some(req => req.id === requestId);
        const type = isEnrollment ? 'enrollment' : 'membership';
        
        if (approve) {
          return handleApproveRequest(requestId, type);
        } else {
          return handleRejectRequest(requestId, type);
        }
      });

      await Promise.all(promises);
      setSelectedRequests([]);
      loadRequests();
    } catch (error) {
      console.error('Error in bulk operation:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (
    request: CourseEnrollmentRequest | SchoolMembershipRequest, 
    type: 'enrollment' | 'membership'
  ) => {
    setReviewDialog({ open: true, request, type });
    setReviewNotes('');
  };

  const filteredEnrollmentRequests = enrollmentRequests.filter(request => {
    if (!searchTerm) return true;
    return (
      request.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.course?.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredMembershipRequests = membershipRequests.filter(request => {
    if (!searchTerm) return true;
    return (
      request.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Approval Requests</h2>
          <p className="text-muted-foreground">
            Review and manage student enrollment and membership requests
          </p>
        </div>
        <div className="flex space-x-2">
          {selectedRequests.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBulkApproval(true)}
                disabled={loading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Selected ({selectedRequests.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkApproval(false)}
                disabled={loading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Selected ({selectedRequests.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students, courses, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different request types */}
      <Tabs defaultValue="enrollment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enrollment" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Course Enrollment ({filteredEnrollmentRequests.length})</span>
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex items-center space-x-2">
            <School className="h-4 w-4" />
            <span>School Membership ({filteredMembershipRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Course Enrollment Requests */}
        <TabsContent value="enrollment" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading enrollment requests...</div>
          ) : filteredEnrollmentRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No enrollment requests found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'pending' 
                    ? "No pending enrollment requests at this time."
                    : "No enrollment requests match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEnrollmentRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedRequests.includes(request.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRequests([...selectedRequests, request.id]);
                            } else {
                              setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {request.student?.firstName} {request.student?.lastName}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Student Email</p>
                              <p className="font-medium">{request.student?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Course</p>
                              <p className="font-medium">
                                {request.course?.code} - {request.course?.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Requested</p>
                              <p className="font-medium">{formatDate(request.requestedAt)}</p>
                            </div>
                            {request.reviewedAt && (
                              <div>
                                <p className="text-sm text-muted-foreground">Reviewed</p>
                                <p className="font-medium">{formatDate(request.reviewedAt)}</p>
                              </div>
                            )}
                          </div>

                          {request.reviewNotes && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground">Review Notes</p>
                              <p className="text-sm bg-muted p-2 rounded">{request.reviewNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(request, 'enrollment')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request.id, 'enrollment')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id, 'enrollment')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* School Membership Requests */}
        <TabsContent value="membership" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading membership requests...</div>
          ) : filteredMembershipRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <School className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No membership requests found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'pending' 
                    ? "No pending membership requests at this time."
                    : "No membership requests match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMembershipRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedRequests.includes(request.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRequests([...selectedRequests, request.id]);
                            } else {
                              setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {request.student?.firstName} {request.student?.lastName}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Student Email</p>
                              <p className="font-medium">{request.student?.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Student ID</p>
                              <p className="font-medium">{request.student?.studentId || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Requested</p>
                              <p className="font-medium">{formatDate(request.requestedAt)}</p>
                            </div>
                            {request.reviewedAt && (
                              <div>
                                <p className="text-sm text-muted-foreground">Reviewed</p>
                                <p className="font-medium">{formatDate(request.reviewedAt)}</p>
                              </div>
                            )}
                          </div>

                          {request.studentIdDocument && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground">Student ID Document</p>
                              <Button variant="outline" size="sm" className="mt-1">
                                <FileText className="mr-2 h-4 w-4" />
                                View Document
                              </Button>
                            </div>
                          )}

                          {request.reviewNotes && (
                            <div className="mb-4">
                              <p className="text-sm text-muted-foreground">Review Notes</p>
                              <p className="text-sm bg-muted p-2 rounded">{request.reviewNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(request, 'membership')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request.id, 'membership')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRequest(request.id, 'membership')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => 
        setReviewDialog({ ...reviewDialog, open })
      }>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Review {reviewDialog.type === 'enrollment' ? 'Enrollment' : 'Membership'} Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reviewDialog.request && (
              <div className="space-y-2">
                <p><strong>Student:</strong> {reviewDialog.request.student?.firstName} {reviewDialog.request.student?.lastName}</p>
                <p><strong>Email:</strong> {reviewDialog.request.student?.email}</p>
                {reviewDialog.type === 'enrollment' && (
                  <p><strong>Course:</strong> {(reviewDialog.request as CourseEnrollmentRequest).course?.name}</p>
                )}
                <p><strong>Requested:</strong> {formatDate(reviewDialog.request.requestedAt)}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setReviewDialog({ open: false, request: null, type: 'enrollment' })}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => reviewDialog.request && handleRejectRequest(
                  reviewDialog.request.id, 
                  reviewDialog.type, 
                  reviewNotes
                )}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => reviewDialog.request && handleApproveRequest(
                  reviewDialog.request.id, 
                  reviewDialog.type, 
                  reviewNotes
                )}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <span className="flex items-center px-4">
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
    </div>
  );
};

export default SchoolApprovalsPanel;