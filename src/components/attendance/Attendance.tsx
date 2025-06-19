
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { attendanceService } from '../../services/attendanceService';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Download,
  BarChart3
} from 'lucide-react';

const Attendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Load real attendance data from localStorage
  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        const records = await attendanceService.getAllAttendance();
        setAttendanceRecords(records);
      } catch (error) {
        console.error('Error loading attendance data:', error);
      }
    };
    
    loadAttendanceData();
  }, []);

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

  // Get unique classes from attendance records
  const uniqueClasses = [...new Set(attendanceRecords.map(record => record.className))];

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || record.timestamp.toDateString() === new Date(selectedDate).toDateString();
    const matchesClass = selectedClass === 'all' || record.className === selectedClass;
    return matchesSearch && matchesDate && matchesClass;
  });

  const exportAttendance = () => {
    attendanceService.downloadAttendanceExcel(filteredRecords, 'filtered_attendance_report');

    toast({
      title: "Export successful",
      description: "Filtered attendance data has been exported to Excel file.",
    });
  };

  if (user?.role !== 'admin') {
    // Student view - show their attendance summary
    const userAttendance = attendanceRecords.filter(record => record.userId === user?.id);
    const totalClasses = uniqueClasses.length;
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
              {userAttendance.length > 0 ? (
                userAttendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(record.status)}
                      <div>
                        <h4 className="font-medium">{record.className}</h4>
                        <p className="text-sm text-gray-600">{record.timestamp.toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        <span>{record.timestamp.toLocaleTimeString()}</span>
                      </div>
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics from real data
  const totalStudents = [...new Set(attendanceRecords.map(record => record.userId))].length;
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const averageAttendance = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track and manage student attendance</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={exportAttendance} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Filtered CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
                    <p className="text-3xl font-bold">{totalStudents}</p>
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
                    <p className="text-3xl font-bold">{averageAttendance}%</p>
                  </div>
                  <BarChart3 className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Records</p>
                    <p className="text-3xl font-bold">{totalRecords}</p>
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
                    <p className="text-3xl font-bold">{lateCount}</p>
                  </div>
                  <Clock className="h-12 w-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Overview of all attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{presentCount}</div>
                  <div className="text-sm text-gray-600">Present</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{lateCount}</div>
                  <div className="text-sm text-gray-600">Late</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{absentCount}</div>
                  <div className="text-sm text-gray-600">Absent</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
              {uniqueClasses.map(className => (
                <option key={className} value={className}>
                  {className}
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
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {record.userName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{record.userName}</h4>
                          <p className="text-sm text-gray-600">{record.className}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{record.timestamp.toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">{record.timestamp.toLocaleTimeString()}</p>
                      </div>
                      <div className="text-center">
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No attendance records found matching your criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;
