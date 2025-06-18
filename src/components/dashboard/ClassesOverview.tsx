
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Course, AttendanceReport, Student } from '@/types/student';
import { Calendar, MapPin, Clock, Users, TrendingUp, Eye, EyeOff } from 'lucide-react';

const mockCourses: Course[] = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Computer Science',
    instructor: 'Dr. Sarah Johnson',
    schedule: '09:00 - 10:30',
    location: 'Room A101',
    days: ['Monday', 'Wednesday', 'Friday'],
    studentsEnrolled: 45,
    attendanceRate: 89
  },
  {
    id: '2',
    code: 'CS201',
    name: 'Data Structures and Algorithms',
    instructor: 'Prof. Michael Brown',
    schedule: '11:00 - 12:30',
    location: 'Room B205',
    days: ['Tuesday', 'Thursday'],
    studentsEnrolled: 38,
    attendanceRate: 92
  },
  {
    id: '3',
    code: 'CS301',
    name: 'Database Management Systems',
    instructor: 'Dr. Emily Davis',
    schedule: '14:00 - 15:30',
    location: 'Room C102',
    days: ['Monday', 'Wednesday'],
    studentsEnrolled: 32,
    attendanceRate: 85
  },
  {
    id: '4',
    code: 'CS401',
    name: 'Software Engineering',
    instructor: 'Prof. James Wilson',
    schedule: '16:00 - 17:30',
    location: 'Room A203',
    days: ['Tuesday', 'Thursday', 'Friday'],
    studentsEnrolled: 28,
    attendanceRate: 94
  }
];

const generateAttendanceReports = (courseId: string): AttendanceReport[] => {
  const reports: AttendanceReport[] = [];
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const total = Math.floor(Math.random() * 10) + 25;
    const present = Math.floor(total * (0.8 + Math.random() * 0.15));
    const late = Math.floor(Math.random() * 3);
    const absent = total - present - late;
    
    reports.push({
      date: date.toLocaleDateString(),
      present,
      absent,
      late,
      total,
      attendanceRate: Math.round((present / total) * 100)
    });
  }
  
  return reports;
};

interface ClassesOverviewProps {
  globalSearchTerm?: string;
}

export const ClassesOverview: React.FC<ClassesOverviewProps> = ({ globalSearchTerm = '' }) => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const filteredCourses = mockCourses.filter(course => 
    course.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(globalSearchTerm.toLowerCase())
  );

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDayBadgeColor = (day: string) => {
    const colors = {
      'Monday': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Tuesday': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Wednesday': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'Thursday': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'Friday': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Saturday': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'Sunday': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[day as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-8">
      {globalSearchTerm && (
        <div className="glass-card p-4">
          <p className="text-white">
            Search results for: <span className="text-sky-blue font-semibold">"{globalSearchTerm}"</span>
            {filteredCourses.length === 0 && <span className="text-gray-400 ml-2">No courses found</span>}
          </p>
        </div>
      )}

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6">My Classes</h2>
        
        <div className="grid gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{course.name}</h3>
                    <Badge className="bg-sky-blue/20 text-sky-blue border border-sky-blue/30 rounded-xl">
                      {course.code}
                    </Badge>
                  </div>
                  <p className="text-gray-400 mb-3">{course.instructor}</p>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl"
                >
                  {selectedCourse === course.id ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {selectedCourse === course.id ? 'Hide' : 'View'} Reports
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="w-4 h-4 text-sky-blue" />
                  <span className="text-sm">{course.schedule}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-sky-blue" />
                  <span className="text-sm">{course.location}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-300">
                  <Users className="w-4 h-4 text-sky-blue" />
                  <span className="text-sm">{course.studentsEnrolled} Students</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-sky-blue" />
                  <span className={`text-sm font-medium ${getAttendanceRateColor(course.attendanceRate)}`}>
                    {course.attendanceRate}% Attendance
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-sky-blue" />
                <div className="flex space-x-2">
                  {course.days.map((day) => (
                    <Badge
                      key={day}
                      className={`text-xs border rounded-lg ${getDayBadgeColor(day)}`}
                    >
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Attendance Reports */}
              {selectedCourse === course.id && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4">Attendance Reports - Last 14 Days</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Date</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Present</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Late</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Absent</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Total</th>
                          <th className="text-left py-2 px-3 text-gray-400 font-medium text-sm">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateAttendanceReports(course.id).map((report, index) => (
                          <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3 text-white text-sm">{report.date}</td>
                            <td className="py-3 px-3 text-green-400 font-medium text-sm">{report.present}</td>
                            <td className="py-3 px-3 text-yellow-400 font-medium text-sm">{report.late}</td>
                            <td className="py-3 px-3 text-red-400 font-medium text-sm">{report.absent}</td>
                            <td className="py-3 px-3 text-gray-300 text-sm">{report.total}</td>
                            <td className={`py-3 px-3 font-medium text-sm ${getAttendanceRateColor(report.attendanceRate)}`}>
                              {report.attendanceRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <h5 className="text-sm font-medium text-white mb-2">Summary Statistics</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400">Avg. Attendance:</span>
                        <span className={`ml-1 font-medium ${getAttendanceRateColor(course.attendanceRate)}`}>
                          {course.attendanceRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Best Day:</span>
                        <span className="ml-1 font-medium text-green-400">
                          {Math.max(...generateAttendanceReports(course.id).map(r => r.attendanceRate))}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Classes:</span>
                        <span className="ml-1 font-medium text-white">14</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Enrolled:</span>
                        <span className="ml-1 font-medium text-sky-blue">{course.studentsEnrolled}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredCourses.length === 0 && globalSearchTerm && (
          <div className="text-center py-8 text-gray-400">
            No classes found matching "{globalSearchTerm}"
          </div>
        )}
      </div>
    </div>
  );
};
