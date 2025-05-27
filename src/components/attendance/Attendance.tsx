
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Download,
  BarChart3
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  joinTime?: string;
  leaveTime?: string;
}

interface ClassSession {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

const Attendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  const [classSessions] = useState<ClassSession[]>([
    {
      id: '1',
      title: 'Mathematics - Calculus',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: 60,
      totalStudents: 25,
      presentCount: 22,
      absentCount: 2,
      lateCount: 1
    },
    {
      id: '2',
      title: 'Physics - Mechanics',
      date: '2024-01-14',
      time: '2:00 PM',
      duration: 90,
      totalStudents: 25,
      presentCount: 24,
      absentCount: 1,
      lateCount: 0
    },
    {
      id: '3',
      title: 'Chemistry - Organic',
      date: '2024-01-13',
      time: '11:00 AM',
      duration: 75,
      totalStudents: 25,
      presentCount: 20,
      absentCount: 3,
      lateCount: 2
    }
  ]);

  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: '1',
      studentId: '1',
      studentName: 'Alice Johnson',
      studentEmail: 'alice@university.edu',
      classId: '1',
      className: 'Mathematics - Calculus',
      date: '2024-01-15',
      status: 'present',
      joinTime: '10:02 AM',
      leaveTime: '11:00 AM'
    },
    {
      id: '2',
      studentId: '2',
      studentName: 'Bob Wilson',
      studentEmail: 'bob@university.edu',
      classId: '1',
      className: 'Mathematics - Calculus',
      date: '2024-01-15',
      status: 'late',
      joinTime: '10:15 AM',
      leaveTime: '11:00 AM'
    },
    {
      id: '3',
      studentId: '3',
      studentName: 'Carol Davis',
      studentEmail: 'carol@university.edu',
      classId: '1',
      className: 'Mathematics - Calculus',
      date: '2024-01-15',
      status: 'absent'
    },
    {
      id: '4',
      studentId: '1',
      studentName: 'Alice Johnson',
      studentEmail: 'alice@university.edu',
      classId: '2',
      className: 'Physics - Mechanics',
      date: '2024-01-14',
      status: 'present',
      joinTime: '2:00 PM',
      leaveTime: '3:30 PM'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800'
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status}</Badge>;
  };

  const calculateAttendanceRate = (present: number, total: number) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || record.date === selectedDate;
    const matchesClass = selectedClass === 'all' || record.classId === selectedClass;
    return matchesSearch && matchesDate && matchesClass;
  });

  const exportAttendance = () => {
    toast({
      title: "Export started",
      description: "Attendance data is being exported to CSV.",
    });
  };

  if (user?.role !== 'admin') {
    // Student view - show their attendance summary
    const userAttendance = attendanceRecords.filter(record => record.studentId === user?.id);
    const totalClasses = classSessions.length;
    const attendedClasses = userAttendance.filter(record => record.status === 'present' || record.status === 'late').length;
    const attendanceRate = calculateAttendanceRate(attendedClasses, totalClasses);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600">View your attendance records and statistics</p>
        </div>

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Attendance Rate</p>
                  <p className="text-3xl font-bold">{attendanceRate}%</p>
                </div>
                <BarChart3 className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Classes Attended</p>
                  <p className="text-3xl font-bold">{attendedClasses}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Late Arrivals</p>
                  <p className="text-3xl font-bold">
                    {userAttendance.filter(r => r.status === 'late').length}
                  </p>
                </div>
                <Clock className="h-12 w-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">Absences</p>
                  <p className="text-3xl font-bold">
                    {userAttendance.filter(r => r.status === 'absent').length}
                  </p>
                </div>
                <XCircle className="h-12 w-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your attendance records for recent classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <h4 className="font-medium">{record.className}</h4>
                      <p className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {record.joinTime && (
                      <div className="text-sm text-gray-600">
                        <span>Joined: {record.joinTime}</span>
                        {record.leaveTime && <span> - Left: {record.leaveTime}</span>}
                      </div>
                    )}
                    {getStatusBadge(record.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track and manage student attendance</p>
        </div>
        <Button onClick={exportAttendance} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Class Sessions</TabsTrigger>
          <TabsTrigger value="records">Detailed Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Total Students</p>
                    <p className="text-3xl font-bold">25</p>
                  </div>
                  <Users className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Average Attendance</p>
                    <p className="text-3xl font-bold">88%</p>
                  </div>
                  <BarChart3 className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Classes This Week</p>
                    <p className="text-3xl font-bold">3</p>
                  </div>
                  <Calendar className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Late Arrivals</p>
                    <p className="text-3xl font-bold">3</p>
                  </div>
                  <Clock className="h-12 w-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions Quick View */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Class Sessions</CardTitle>
              <CardDescription>Attendance summary for recent classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{session.title}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(session.date).toLocaleDateString()} at {session.time}
                      </p>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{session.presentCount}</div>
                        <div className="text-xs text-gray-500">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{session.lateCount}</div>
                        <div className="text-xs text-gray-500">Late</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{session.absentCount}</div>
                        <div className="text-xs text-gray-500">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {calculateAttendanceRate(session.presentCount, session.totalStudents)}%
                        </div>
                        <div className="text-xs text-gray-500">Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classSessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{session.title}</span>
                    <Badge variant="outline">
                      {calculateAttendanceRate(session.presentCount, session.totalStudents)}% attendance
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {new Date(session.date).toLocaleDateString()} at {session.time} ({session.duration} min)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{session.presentCount}</div>
                      <div className="text-sm text-gray-600">Present</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{session.lateCount}</div>
                      <div className="text-sm text-gray-600">Late</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{session.absentCount}</div>
                      <div className="text-sm text-gray-600">Absent</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${calculateAttendanceRate(session.presentCount, session.totalStudents)}%` }}
                    ></div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {classSessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Detailed attendance records ({filteredRecords.length} records)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {record.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{record.studentName}</h4>
                        <p className="text-sm text-gray-600">{record.studentEmail}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{record.className}</p>
                      <p className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                      {record.joinTime && (
                        <div className="text-sm text-gray-600 mb-1">
                          {record.joinTime} - {record.leaveTime}
                        </div>
                      )}
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                ))}
              </div>
              {filteredRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;
