
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Search, User } from 'lucide-react';

interface DashboardHeaderProps {
  userRole: string;
  title: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userRole, title }) => {
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
          <Button variant="ghost" size="sm" className="glass-button p-3 relative">
            <Bell className="w-5 h-5 text-sky-blue" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </Button>
          <Button variant="ghost" size="sm" className="glass-button p-3">
            <User className="w-5 h-5 text-sky-blue" />
          </Button>
        </div>
      </div>
    </div>
  );
};
