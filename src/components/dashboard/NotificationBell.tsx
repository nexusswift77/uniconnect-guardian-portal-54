
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Check, Clock } from 'lucide-react';
import { Student } from '@/types/student';

interface NotificationBellProps {
  students: Student[];
  onApprove?: (studentId: string) => void;
  onReject?: (studentId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  students,
  onApprove,
  onReject
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const pendingStudents = students.filter(student => student.status === 'pending');
  const pendingCount = pendingStudents.length;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="glass-button p-3 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-sky-blue" />
        {pendingCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">{pendingCount}</span>
          </div>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg z-[9999]">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Pending Approvals</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {pendingCount > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                {pendingCount} student{pendingCount === 1 ? '' : 's'} waiting for approval
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {pendingCount === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div className="p-2">
                {pendingStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-white text-sm truncate">
                            {student.name}
                          </p>
                          <Badge className="status-warning border rounded text-xs">
                            {student.method}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">ID: {student.studentId}</p>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{student.checkInTime || 'Just now'}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            onApprove?.(student.id);
                            if (pendingStudents.length === 1) {
                              setIsOpen(false);
                            }
                          }}
                          className="h-7 w-7 p-0 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            onReject?.(student.id);
                            if (pendingStudents.length === 1) {
                              setIsOpen(false);
                            }
                          }}
                          className="h-7 w-7 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
