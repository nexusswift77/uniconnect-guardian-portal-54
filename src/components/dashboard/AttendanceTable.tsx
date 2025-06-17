
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Clock } from 'lucide-react';
import { Student } from '@/types/student';

interface AttendanceTableProps {
  students: Student[];
  onApprove?: (studentId: string) => void;
  onReject?: (studentId: string) => void;
  userRole: string;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ 
  students, 
  onApprove, 
  onReject, 
  userRole 
}) => {
  const getStatusBadge = (status: string, method: string) => {
    if (status === 'verified') {
      return <Badge className="status-online border rounded-xl">✅ {method} Verified</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="status-warning border rounded-xl">⚠️ {method} Pending</Badge>;
    }
    return <Badge className="status-offline border rounded-xl">❌ Absent</Badge>;
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Live Attendance</h2>
        <div className="flex space-x-2">
          <Badge className="status-online border rounded-xl">
            {students.filter(s => s.status === 'verified').length} Present
          </Badge>
          <Badge className="status-warning border rounded-xl">
            {students.filter(s => s.status === 'pending').length} Pending
          </Badge>
          <Badge className="status-offline border rounded-xl">
            {students.filter(s => s.status === 'absent').length} Absent
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Student</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Student ID</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Check-in Time</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
              {userRole === 'lecturer' && <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4 text-white font-medium">{student.name}</td>
                <td className="py-4 px-4 text-gray-400">{student.studentId}</td>
                <td className="py-4 px-4 text-gray-400">
                  {student.checkInTime || '-'}
                </td>
                <td className="py-4 px-4">
                  {getStatusBadge(student.status, student.method)}
                </td>
                {userRole === 'lecturer' && (
                  <td className="py-4 px-4">
                    {student.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => onApprove?.(student.id)}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onReject?.(student.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
