
export interface Student {
  id: string;
  name: string;
  studentId: string;
  checkInTime?: string;
  method: 'BLE' | 'QR' | 'Absent';
  status: 'verified' | 'pending' | 'absent';
}
