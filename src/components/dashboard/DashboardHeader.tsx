
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, User, X } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { Student } from '@/types/student';

interface DashboardHeaderProps {
  userRole: string;
  title: string;
  students?: Student[];
  onApprove?: (studentId: string) => void;
  onReject?: (studentId: string) => void;
  onSearch?: (searchTerm: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  userRole, 
  title, 
  students = [],
  onApprove,
  onReject,
  onSearch 
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
    setSearchTerm('');
    onSearch?.('');
  };

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex-1">
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
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-sky-blue/50 w-64"
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchClose}
                className="glass-button p-2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </form>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="glass-button p-3"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-5 h-5 text-sky-blue" />
            </Button>
          )}
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
