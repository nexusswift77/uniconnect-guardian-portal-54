import React from 'react';
import { EnhancedUser, School } from '@/types/enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi } from 'lucide-react';

interface SchoolBeaconManagementProps {
  user: EnhancedUser;
  school: School | null;
  onUpdate: () => void;
}

const SchoolBeaconManagement: React.FC<SchoolBeaconManagementProps> = ({ user, school, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Beacon Management</h2>
        <p className="text-muted-foreground">
          Manage BLE beacons for {school?.name || 'your school'}
        </p>
      </div>

      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <Wifi className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Beacon Management</h3>
            <p className="text-muted-foreground">Beacon management interface coming soon</p>
            <Badge variant="outline" className="mt-4">In Development</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolBeaconManagement; 