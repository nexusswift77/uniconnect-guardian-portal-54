import React from 'react';
import { EnhancedUser, School, SchoolStats } from '@/types/enhanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, GraduationCap } from 'lucide-react';

interface SchoolAnalyticsProps {
  user: EnhancedUser;
  school: School | null;
  schoolStats: SchoolStats | null;
}

const SchoolAnalytics: React.FC<SchoolAnalyticsProps> = ({ user, school, schoolStats }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">School Analytics</h2>
        <p className="text-muted-foreground">
          Performance analytics for {school?.name || 'your school'}
        </p>
      </div>

      {schoolStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Enrolled students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lecturers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.totalLecturers}</div>
              <p className="text-xs text-muted-foreground">
                Faculty members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Beacons</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.activeBeacons}</div>
              <p className="text-xs text-muted-foreground">
                Operational beacons
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Analytics Loading</h3>
              <p className="text-muted-foreground">School analytics data is being loaded...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center py-8">
        <Badge variant="outline">Detailed analytics dashboard coming soon</Badge>
      </div>
    </div>
  );
};

export default SchoolAnalytics; 