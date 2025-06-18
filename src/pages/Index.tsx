
import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AttendanceTable } from '@/components/dashboard/AttendanceTable';
import { QRGenerator } from '@/components/dashboard/QRGenerator';
import { LecturerOverview } from '@/components/dashboard/LecturerOverview';
import { ClassesOverview } from '@/components/dashboard/ClassesOverview';
import { Users, Calendar, Clock, Monitor, Bell, Grid2X2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Student } from '@/types/student';

// Mock data with 30 students
const mockStudents: Student[] = [
  { id: '1', name: 'Alice Johnson', studentId: 'ST001', checkInTime: '09:02 AM', method: 'BLE', status: 'verified' },
  { id: '2', name: 'Bob Smith', studentId: 'ST002', checkInTime: '09:05 AM', method: 'QR', status: 'pending' },
  { id: '3', name: 'Carol Davis', studentId: 'ST003', checkInTime: '09:01 AM', method: 'BLE', status: 'verified' },
  { id: '4', name: 'David Wilson', studentId: 'ST004', method: 'Absent', status: 'absent' },
  { id: '5', name: 'Eva Brown', studentId: 'ST005', checkInTime: '09:03 AM', method: 'BLE', status: 'verified' },
  { id: '6', name: 'Frank Miller', studentId: 'ST006', checkInTime: '09:07 AM', method: 'QR', status: 'pending' },
  { id: '7', name: 'Grace Lee', studentId: 'ST007', checkInTime: '09:00 AM', method: 'BLE', status: 'verified' },
  { id: '8', name: 'Henry Taylor', studentId: 'ST008', checkInTime: '09:04 AM', method: 'BLE', status: 'verified' },
  { id: '9', name: 'Ivy Chen', studentId: 'ST009', method: 'Absent', status: 'absent' },
  { id: '10', name: 'Jack Thompson', studentId: 'ST010', checkInTime: '09:06 AM', method: 'QR', status: 'pending' },
  { id: '11', name: 'Kate Anderson', studentId: 'ST011', checkInTime: '09:02 AM', method: 'BLE', status: 'verified' },
  { id: '12', name: 'Liam Rodriguez', studentId: 'ST012', checkInTime: '09:08 AM', method: 'BLE', status: 'verified' },
  { id: '13', name: 'Maya Patel', studentId: 'ST013', method: 'Absent', status: 'absent' },
  { id: '14', name: 'Noah Garcia', studentId: 'ST014', checkInTime: '09:03 AM', method: 'QR', status: 'pending' },
  { id: '15', name: 'Olivia Wright', studentId: 'ST015', checkInTime: '09:01 AM', method: 'BLE', status: 'verified' },
  { id: '16', name: 'Parker Kim', studentId: 'ST016', checkInTime: '09:05 AM', method: 'BLE', status: 'verified' },
  { id: '17', name: 'Quinn Foster', studentId: 'ST017', method: 'Absent', status: 'absent' },
  { id: '18', name: 'Ruby Martinez', studentId: 'ST018', checkInTime: '09:07 AM', method: 'QR', status: 'pending' },
  { id: '19', name: 'Sam Cooper', studentId: 'ST019', checkInTime: '09:02 AM', method: 'BLE', status: 'verified' },
  { id: '20', name: 'Tara Johnson', studentId: 'ST020', checkInTime: '09:04 AM', method: 'BLE', status: 'verified' },
  { id: '21', name: 'Ulysses King', studentId: 'ST021', method: 'Absent', status: 'absent' },
  { id: '22', name: 'Vera Lopez', studentId: 'ST022', checkInTime: '09:06 AM', method: 'QR', status: 'pending' },
  { id: '23', name: 'Wade Scott', studentId: 'ST023', checkInTime: '09:01 AM', method: 'BLE', status: 'verified' },
  { id: '24', name: 'Xara Bell', studentId: 'ST024', checkInTime: '09:08 AM', method: 'BLE', status: 'verified' },
  { id: '25', name: 'Yuki Tanaka', studentId: 'ST025', method: 'Absent', status: 'absent' },
  { id: '26', name: 'Zoe Adams', studentId: 'ST026', checkInTime: '09:03 AM', method: 'QR', status: 'pending' },
  { id: '27', name: 'Aaron Brooks', studentId: 'ST027', checkInTime: '09:05 AM', method: 'BLE', status: 'verified' },
  { id: '28', name: 'Bella Cruz', studentId: 'ST028', checkInTime: '09:02 AM', method: 'BLE', status: 'verified' },
  { id: '29', name: 'Carlos Rivera', studentId: 'ST029', method: 'Absent', status: 'absent' },
  { id: '30', name: 'Diana Foster', studentId: 'ST030', checkInTime: '09:07 AM', method: 'QR', status: 'pending' },
];

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const { toast } = useToast();

  const handleLogin = (email: string, password: string, role: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    console.log('Login successful:', { email, role });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setActiveTab('dashboard');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const handleApprove = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, status: 'verified' as const }
        : student
    ));
    toast({
      title: "Student Approved",
      description: "QR check-in has been approved",
    });
  };

  const handleReject = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, status: 'absent' as const, method: 'Absent' as const, checkInTime: undefined }
        : student
    ));
    toast({
      title: "Student Rejected",
      description: "QR check-in has been rejected",
      variant: "destructive",
    });
  };

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard Overview',
      classes: 'My Classes',
      attendance: 'Live Attendance',
      'qr-generator': 'QR Code Generator',
      reports: 'Attendance Reports',
      analytics: userRole === 'admin' ? 'System Analytics' : 'Department Analytics',
      users: 'User Management',
      audit: 'Audit Trail',
      rules: 'System Rules',
      lecturers: 'Lecturer Overview'
    };
    return titles[activeTab as keyof typeof titles] || 'Dashboard';
  };

  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                title="Total Students" 
                value="30" 
                change="12%" 
                trend="up" 
                icon={Users} 
                color="blue"
              />
              <MetricCard 
                title="Present Today" 
                value={students.filter(s => s.status === 'verified').length.toString()} 
                change="8%" 
                trend="up" 
                icon={Calendar} 
                color="green"
              />
              <MetricCard 
                title="Attendance Rate" 
                value={`${Math.round((students.filter(s => s.status === 'verified').length / students.length) * 100)}%`}
                change="3%" 
                trend="up" 
                icon={Clock} 
                color="blue"
              />
              <MetricCard 
                title="Active Sessions" 
                value="3" 
                icon={Monitor} 
                color="yellow"
              />
            </div>
            
            <AttendanceTable 
              students={students} 
              onApprove={handleApprove}
              onReject={handleReject}
              userRole={userRole}
              showSearch={true}
            />
          </div>
        );
      
      case 'attendance':
        return (
          <AttendanceTable 
            students={students} 
            onApprove={handleApprove}
            onReject={handleReject}
            userRole={userRole}
            showSearch={true}
          />
        );
      
      case 'classes':
        return <ClassesOverview />;
      
      case 'qr-generator':
        return <QRGenerator />;
      
      case 'lecturers':
        return <LecturerOverview />;
      
      default:
        return (
          <div className="glass-card p-12 text-center">
            <Grid2X2 className="w-16 h-16 text-sky-blue mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{getPageTitle()}</h2>
            <p className="text-gray-400">This section is coming soon</p>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar 
        userRole={userRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 p-8 overflow-auto">
        <DashboardHeader 
          userRole={userRole} 
          title={getPageTitle()}
          students={students}
          onApprove={handleApprove}
          onReject={handleReject}
        />
        {renderDashboardContent()}
      </div>
    </div>
  );
};

export default Index;
