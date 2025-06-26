import React, { useState, useEffect } from 'react';
import { EnhancedUser, EnhancedCourse, CourseEnrollmentRequest } from '@/types/enhanced';
import { ApprovalService, CourseService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Search,
  CheckCircle,
  XCircle,
  Eye,
  BookOpen,
  Users,
  Calendar,
  Filter
} from 'lucide-react';

interface CourseEnrollmentRequestsProps {
  user: EnhancedUser;
}

const CourseEnrollmentRequests: React.FC<CourseEnrollmentRequestsProps> = ({ user }) => {
  const [courses, setCourses] = useState<EnhancedCourse[]>([]);
  const [requests, setRequests] = useState<CourseEnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    request: CourseEnrollmentRequest | null;
  }>({ open: false, request: null });
  const [reviewNotes, setReviewNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCourses();
  }, [user.id]);

  useEffect(() => {
    loadRequests();
  }, [selectedCourse, currentPage, statusFilter]);

  const loadCourses = async () => {
    try {
      const response = await CourseService.getCoursesByInstructor(user.id, 1, 100);
      setCourses(response.data);
      if (response.data.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadRequests = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      const response = await ApprovalService.getCourseEnrollmentRequests(
        currentPage,
        20,
        selectedCourse,
        undefined,
        statusFilter === 'all' ? undefined : statusFilter as any
      );
      setRequests(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading enrollment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, notes?: string) => {
    try {
      await ApprovalService.reviewCourseEnrollmentRequest(requestId, {
        status: 'approved',
        reviewNotes: notes
      });
      loadRequests();
      setReviewDialog({ open: false, request: null });
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string, notes?: string) => {
    try {
      await ApprovalService.reviewCourseEnrollmentRequest(requestId, {
        status: 'rejected',
        reviewNotes: notes
      });
      loadRequests();
      setReviewDialog({ open: false, request: null });
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleBulkApproval = async (approve: boolean) => {
    if (selectedRequests.length === 0) return;

    try {
      setLoading(true);
      const promises = selectedRequests.map(requestId => {
        if (approve) {
          return handleApproveRequest(requestId);
        } else {
          return handleRejectRequest(requestId);
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

  const openReviewDialog = (request: CourseEnrollmentRequest) => {
    setReviewDialog({ open: true, request });
    setReviewNotes('');
  };

  const filteredRequests = requests.filter(request => {
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

  const selectedCourseData = courses.find(course => course.id === selectedCourse);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Course Enrollment Requests</h2>
          <p className="text-muted-foreground">
            Review and manage student enrollment requests for your courses
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

      {/* Course Selection and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px]">
              <Label htmlFor="course-select">Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Course Info */}
      {selectedCourseData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedCourseData.code} - {selectedCourseData.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    Max {selectedCourseData.maxStudents} students
                  </span>
                  {selectedCourseData.location && (
                    <span>{selectedCourseData.location}</span>
                  )}
                  {selectedCourseData.approvalRequired && (
                    <Badge variant="secondary">Approval Required</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading enrollment requests...</div>
        ) : !selectedCourse ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No course selected</h3>
              <p className="text-muted-foreground">
                Please select a course to view enrollment requests.
              </p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No enrollment requests found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'pending' 
                  ? "No pending enrollment requests for this course."
                  : "No enrollment requests match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
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
                      </div>

                      {request.reviewedAt && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Reviewed By</p>
                            <p className="font-medium">
                              {request.reviewer?.firstName} {request.reviewer?.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Reviewed</p>
                            <p className="font-medium">{formatDate(request.reviewedAt)}</p>
                          </div>
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
                      onClick={() => openReviewDialog(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => 
        setReviewDialog({ ...reviewDialog, open })
      }>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Enrollment Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reviewDialog.request && (
              <div className="space-y-2">
                <p><strong>Student:</strong> {reviewDialog.request.student?.firstName} {reviewDialog.request.student?.lastName}</p>
                <p><strong>Email:</strong> {reviewDialog.request.student?.email}</p>
                <p><strong>Student ID:</strong> {reviewDialog.request.student?.studentId || 'Not provided'}</p>
                <p><strong>Course:</strong> {reviewDialog.request.course?.code} - {reviewDialog.request.course?.name}</p>
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
                onClick={() => setReviewDialog({ open: false, request: null })}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => reviewDialog.request && handleRejectRequest(
                  reviewDialog.request.id, 
                  reviewNotes
                )}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => reviewDialog.request && handleApproveRequest(
                  reviewDialog.request.id, 
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

export default CourseEnrollmentRequests;