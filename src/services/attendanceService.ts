
import { supabase } from '@/integrations/supabase/client';

export interface AttendanceRecord {
  id?: string;
  userId: string;
  userName: string;
  classId: string;
  className: string;
  timestamp: Date;
  status: 'present' | 'absent' | 'late';
}

class AttendanceService {
  async markAttendance(
    userId: string, 
    userName: string, 
    classId: string, 
    className: string
  ): Promise<void> {
    try {
      // For now, store in localStorage until we create attendance table in Supabase
      const attendance = {
        userId,
        userName,
        classId,
        className,
        timestamp: new Date(),
        status: 'present' as const
      };
      
      const attendanceRecords = JSON.parse(localStorage.getItem('virtualClassroom_attendance') || '[]');
      attendanceRecords.push(attendance);
      localStorage.setItem('virtualClassroom_attendance', JSON.stringify(attendanceRecords));
      
      console.log('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  }

  async getAttendanceByClass(classId: string): Promise<AttendanceRecord[]> {
    try {
      const attendanceRecords = JSON.parse(localStorage.getItem('virtualClassroom_attendance') || '[]');
      return attendanceRecords
        .filter((record: any) => record.classId === classId)
        .map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }))
        .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    try {
      const attendanceRecords = JSON.parse(localStorage.getItem('virtualClassroom_attendance') || '[]');
      return attendanceRecords
        .map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }))
        .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      return [];
    }
  }

  async getUserAttendance(userId: string): Promise<AttendanceRecord[]> {
    try {
      const attendanceRecords = JSON.parse(localStorage.getItem('virtualClassroom_attendance') || '[]');
      return attendanceRecords
        .filter((record: any) => record.userId === userId)
        .map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }))
        .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching user attendance:', error);
      return [];
    }
  }

  generateAttendanceSheet(records: AttendanceRecord[]): string {
    const headers = ['Student Name', 'Class', 'Date', 'Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        `"${record.userName}"`,
        `"${record.className}"`,
        `"${record.timestamp.toLocaleDateString()}"`,
        `"${record.timestamp.toLocaleTimeString()}"`,
        `"${record.status}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  }

  downloadAttendanceSheet(records: AttendanceRecord[], filename: string = 'attendance'): void {
    const csvContent = this.generateAttendanceSheet(records);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Enhanced Excel-like download with better formatting
  downloadAttendanceExcel(records: AttendanceRecord[], filename: string = 'attendance_report'): void {
    const headers = ['Student Name', 'Class Name', 'Date', 'Time', 'Status', 'Day of Week'];
    
    const csvContent = [
      headers.join(','),
      ...records.map(record => {
        const date = record.timestamp;
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        return [
          `"${record.userName}"`,
          `"${record.className}"`,
          `"${date.toLocaleDateString()}"`,
          `"${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"`,
          `"${record.status.toUpperCase()}"`,
          `"${dayOfWeek}"`
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Download comprehensive attendance report with statistics
  downloadComprehensiveReport(records: AttendanceRecord[], filename: string = 'comprehensive_attendance_report'): void {
    const headers = [
      'Student Name', 
      'Class Name', 
      'Date', 
      'Time', 
      'Status', 
      'Day of Week',
      'Month',
      'Week Number'
    ];
    
    const csvContent = [
      headers.join(','),
      ...records.map(record => {
        const date = record.timestamp;
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        const weekNumber = this.getWeekNumber(date);
        
        return [
          `"${record.userName}"`,
          `"${record.className}"`,
          `"${date.toLocaleDateString()}"`,
          `"${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}"`,
          `"${record.status.toUpperCase()}"`,
          `"${dayOfWeek}"`,
          `"${month}"`,
          `"${weekNumber}"`
        ].join(',');
      }),
      '', // Empty row
      'ATTENDANCE SUMMARY',
      `"Total Records","${records.length}"`,
      `"Present","${records.filter(r => r.status === 'present').length}"`,
      `"Absent","${records.filter(r => r.status === 'absent').length}"`,
      `"Late","${records.filter(r => r.status === 'late').length}"`,
      `"Attendance Rate","${((records.filter(r => r.status === 'present' || r.status === 'late').length / records.length) * 100).toFixed(2)}%"`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

export const attendanceService = new AttendanceService();
