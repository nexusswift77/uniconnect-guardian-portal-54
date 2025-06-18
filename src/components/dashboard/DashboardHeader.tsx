
import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, User } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { Student } from '@/types/student';

interface DashboardHeaderProps {
  userRole: string;
  title: string;
  students?: Student[];
  onApprove?: (studentId: string) => void;
  onReject?: (studentId: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  userRole, 
  title, 
  students = [],
  onApprove,
  onReject 
}) => {
  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="glass-button p-3">
            <Search className="w-5 h-5 text-sky-blue" />
          </Button>
          <NotificationBell 
            students={students}
            onApprove={onApprove}
            onReject={onReject}
          />
          <Button variant="ghost" size="sm" className="glass-button p-3">
            <User className="w-5 h-5 text-sky-blue" />
          </Button>
        </div>
      </div>
    </div>
  );
};
