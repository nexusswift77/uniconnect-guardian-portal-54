
import React from 'react';
import { MetricCard } from './MetricCard';
import { Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LecturerData {
  id: string;
  name: string;
  email: string;
  classesToday: number;
  attendedClasses: number;
  totalStudents: number;
  studentsPresent: number;
  bleCheckIns: number;
  qrCheckIns: number;
  status: 'present' | 'absent' | 'partial';
}

const mockLecturers: LecturerData[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@uni.edu',
    classesToday: 3,
    attendedClasses: 3,
    totalStudents: 45,
    studentsPresent: 42,
    bleCheckIns: 38,
    qrCheckIns: 4,
    status: 'present'
  },
  {
    id: '2',
    name: 'Prof. Michael Brown',
    email: 'michael.brown@uni.edu',
    classesToday: 2,
    attendedClasses: 1,
    totalStudents: 32,
    studentsPresent: 28,
    bleCheckIns: 25,
    qrCheckIns: 3,
    status: 'partial'
  },
  {
    id: '3',
    name: 'Dr. Emily Davis',
    email: 'emily.davis@uni.edu',
    classesToday: 2,
    attendedClasses: 0,
    totalStudents: 38,
    studentsPresent: 0,
    bleCheckIns: 0,
    qrCheckIns: 0,
    status: 'absent'
  },
  {
    id: '4',
    name: 'Prof. James Wilson',
    email: 'james.wilson@uni.edu',
    classesToday: 1,
    attendedClasses: 1,
    totalStudents: 28,
    studentsPresent: 26,
    bleCheckIns: 24,
    qrCheckIns: 2,
    status: 'present'
  }
];

export const LecturerOverview: React.FC = () => {
  const presentLecturers = mockLecturers.filter(l => l.status === 'present').length;
  const absentLecturers = mockLecturers.filter(l => l.status === 'absent').length;
  const partialLecturers = mockLecturers.filter(l => l.status === 'partial').length;
  
  const totalStudents = mockLecturers.reduce((sum, l) => sum + l.totalStudents, 0);
  const totalPresent = mockLecturers.reduce((sum, l) => sum + l.studentsPresent, 0);
  const totalBLE = mockLecturers.reduce((sum, l) => sum + l.bleCheckIns, 0);
  const totalQR = mockLecturers.reduce((sum, l) => sum + l.qrCheckIns, 0);

  const getStatusBadge = (status: string, attendedClasses: number, totalClasses: number) => {
    if (status === 'present') {
      return <Badge className="status-online border rounded-xl">✅ All Classes</Badge>;
    }
    if (status === 'partial') {
      return <Badge className="status-warning border rounded-xl">⚠️ {attendedClasses}/{totalClasses} Classes</Badge>;
    }
    return <Badge className="status-offline border rounded-xl">❌ Absent</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Lecturers Present" 
          value={presentLecturers} 
          change={`${((presentLecturers / mockLecturers.length) * 100).toFixed(0)}%`}
          trend="up" 
          icon={Users} 
          color="green"
        />
        <MetricCard 
          title="Lecturers Absent" 
          value={absentLecturers} 
          change={`${((absentLecturers / mockLecturers.length) * 100).toFixed(0)}%`}
          trend={absentLecturers > 0 ? "down" : "neutral"} 
          icon={Calendar} 
          color="red"
        />
        <MetricCard 
          title="Student Attendance" 
          value={`${((totalPresent / totalStudents) * 100).toFixed(0)}%`} 
          change={`${totalPresent}/${totalStudents}`}
          trend="up" 
          icon={CheckCircle} 
          color="blue"
        />
        <MetricCard 
          title="BLE vs QR Check-ins" 
          value={`${totalBLE}/${totalQR}`} 
          change={`${((totalBLE / (totalBLE + totalQR)) * 100).toFixed(0)}% BLE`}
          trend="neutral" 
          icon={Clock} 
          color="yellow"
        />
      </div>

      {/* Lecturer Details Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Lecturer Attendance Overview</h2>
          <div className="flex space-x-2">
            <Badge className="status-online border rounded-xl">
              {presentLecturers} Present
            </Badge>
            <Badge className="status-warning border rounded-xl">
              {partialLecturers} Partial
            </Badge>
            <Badge className="status-offline border rounded-xl">
              {absentLecturers} Absent
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Lecturer</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Classes Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Student Attendance</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">BLE Check-ins</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">QR Check-ins</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {mockLecturers.map((lecturer) => (
                <tr key={lecturer.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white font-medium">{lecturer.name}</div>
                      <div className="text-gray-400 text-sm">{lecturer.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(lecturer.status, lecturer.attendedClasses, lecturer.classesToday)}
                  </td>
                  <td className="py-4 px-4 text-gray-400">
                    {lecturer.studentsPresent}/{lecturer.totalStudents}
                  </td>
                  <td className="py-4 px-4 text-green-400 font-medium">
                    {lecturer.bleCheckIns}
                  </td>
                  <td className="py-4 px-4 text-yellow-400 font-medium">
                    {lecturer.qrCheckIns}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-medium ${
                      (lecturer.studentsPresent / lecturer.totalStudents) > 0.8 
                        ? 'text-green-400' 
                        : (lecturer.studentsPresent / lecturer.totalStudents) > 0.6 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                    }`}>
                      {lecturer.totalStudents > 0 ? ((lecturer.studentsPresent / lecturer.totalStudents) * 100).toFixed(0) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
