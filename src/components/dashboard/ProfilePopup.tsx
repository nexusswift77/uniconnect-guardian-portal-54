
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Clock, Settings, LogOut } from 'lucide-react';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onLogout: () => void;
}

export const ProfilePopup: React.FC<ProfilePopupProps> = ({
  isOpen,
  onClose,
  userRole,
  onLogout
}) => {
  const getUserInfo = () => {
    const roleInfo = {
      lecturer: {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@uni.edu',
        department: 'Computer Science',
        employeeId: 'EMP001',
        joinDate: '2020-01-15'
      },
      admin: {
        name: 'Michael Admin',
        email: 'admin@uni.edu',
        department: 'IT Administration',
        employeeId: 'ADM001',
        joinDate: '2019-03-10'
      },
      head_lecturer: {
        name: 'Prof. Emily Davis',
        email: 'emily.davis@uni.edu',
        department: 'Computer Science',
        employeeId: 'HL001',
        joinDate: '2018-08-20'
      }
    };
    
    return roleInfo[userRole as keyof typeof roleInfo] || roleInfo.lecturer;
  };

  const userInfo = getUserInfo();
  const initials = userInfo.name.split(' ').map(n => n[0]).join('');

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      lecturer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      head_lecturer: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[role as keyof typeof colors] || colors.lecturer;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-sky-blue/20 text-sky-blue text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{userInfo.name}</h3>
              <Badge className={`text-xs border rounded-lg ${getRoleBadgeColor(userRole)}`}>
                {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-sky-blue" />
              <span className="text-gray-300">{userInfo.email}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-sky-blue" />
              <span className="text-gray-300">Employee ID: {userInfo.employeeId}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-sky-blue" />
              <span className="text-gray-300">Department: {userInfo.department}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-sky-blue" />
              <span className="text-gray-300">Joined: {new Date(userInfo.joinDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <Button 
              variant="ghost" 
              className="w-full justify-start glass-button text-white hover:bg-white/10"
            >
              <Settings className="w-4 h-4 mr-3" />
              Account Settings
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
