
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from './authService';

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
      await addDoc(collection(db, 'attendance'), {
        userId,
        userName,
        classId,
        className,
        timestamp: new Date(),
        status: 'present'
      });
      console.log('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  }

  async getAttendanceByClass(classId: string): Promise<AttendanceRecord[]> {
    try {
      const q = query(
        collection(db, 'attendance'), 
        where('classId', '==', classId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as AttendanceRecord[];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    try {
      const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as AttendanceRecord[];
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      return [];
    }
  }

  generateAttendanceSheet(records: AttendanceRecord[]): string {
    const headers = ['Student Name', 'Class', 'Date', 'Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...records.map(record => [
        record.userName,
        record.className,
        record.timestamp.toLocaleDateString(),
        record.timestamp.toLocaleTimeString(),
        record.status
      ].join(','))
    ].join('\n');
    
    return csvContent;
  }

  downloadAttendanceSheet(records: AttendanceRecord[], filename: string = 'attendance'): void {
    const csvContent = this.generateAttendanceSheet(records);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

export const attendanceService = new AttendanceService();
