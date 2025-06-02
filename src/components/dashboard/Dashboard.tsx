import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { materialService } from '../../services/materialService';
import { assignmentService, AssignmentWithSubmissions } from '../../services/assignmentService';
import { attendanceService } from '../../services/attendanceService';
import { videoConferenceService } from '../../services/videoConferenceService';
import { classService, ClassWithProfile } from '../../services/classService';
import { 
  Calendar, 
  Video, 
  FileText, 
  FolderOpen, 
  Users, 
  MessageCircle,
  Clock,
  BookOpen,
  TrendingUp,
  Download,
  Trash2,
  Eye,
  ExternalLink
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState<ClassWithProfile[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalClasses: 0,
    totalAssignments: 0,
    attendanceRate: 95
  });

  // Auto-delete expired classes
  const cleanupExpiredClasses = async (classes: ClassWithProfile[]) => {
    const now = new Date();
    
    for (const classItem of classes) {
      const classDateTime = new Date(`${classItem.date} ${classItem.time}`);
      const classEndTime = new Date(classDateTime.getTime() + (classItem.duration * 60 * 1000));
      
      // If class ended more than 1 hour ago, delete it
      const oneHourAfterEnd = new Date(classEndTime.getTime() + (60 * 60 * 1000));
      
      if (now > oneHourAfterEnd) {
        try {
          await classService.deleteClass(classItem.id);
          console.log(`Auto-deleted expired class: ${classItem.title}`);
        } catch (error) {
          console.error('Error auto-deleting expired class:', error);
        }
      }
    }
  };

  // Load real data from Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('Loading dashboard data for user:', user.id);

        // Load classes from Supabase
        const allClasses = await classService.getClasses();
        console.log('Loaded classes from Supabase:', allClasses);
        
        // Auto-cleanup expired classes
        await cleanupExpiredClasses(allClasses);
        
        // Refresh classes after cleanup
        const classes = await classService.getClasses();
        
        // Get upcoming classes (within next 7 days)
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        
        const upcoming = classes
          .filter(cls => {
            const classDate = new Date(`${cls.date} ${cls.time}`);
            return classDate >= now;
          })
          .sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5);
        
        setUpcomingClasses(upcoming);

        // Load materials from Supabase
        const materials = await materialService.getMaterials();
        console.log('Loaded materials:', materials);
        
        // Get recent materials (last 3)
        const recentMats = materials
          .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
          .slice(0, 3)
          .map(material => ({
            id: material.id,
            title: material.title,
            fileType: material.file_type,
            fileSize: material.file_size,
            downloadUrl: material.file_url,
            webViewLink: material.file_url,
            uploadedAt: material.uploaded_at
          }));

        setRecentMaterials(recentMats);

        // Load assignments from Supabase
        const assignments = await assignmentService.getAssignments();
        console.log('Loaded assignments:', assignments);

        // Get recent assignments (due within next 14 days)
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14);
        
        const recentAssns = assignments
          .filter(assignment => {
            const dueDate = new Date(assignment.due_date);
            return dueDate >= now && dueDate <= twoWeeksFromNow;
          })
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 3)
          .map(assignment => {
            const dueDate = new Date(assignment.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const userSubmission = assignment.submissions?.find((s: any) => s.student_id === user?.id);
            
            return {
              id: assignment.id,
              title: assignment.title,
              dueDate: assignment.due_date,
              due: daysUntilDue > 0 ? `${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}` : 'Today',
              status: userSubmission ? 'submitted' : 'pending'
            };
          });

        setRecentAssignments(recentAssns);

        // Update statistics
        setStatistics({
          totalClasses: classes.length,
          totalAssignments: assignments.length,
          attendanceRate: 95
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await materialService.deleteMaterial(materialId);
      setRecentMaterials(prev => prev.filter(m => m.id !== materialId));
      console.log('Material deleted successfully');
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleDownloadAttendance = async () => {
    try {
      const records = await attendanceService.getAllAttendance();
      attendanceService.downloadAttendanceSheet(records, 'all_attendance');
    } catch (error) {
      console.error('Error downloading attendance:', error);
    }
  };

  const joinClass = (classItem: ClassWithProfile) => {
    videoConferenceService.joinMeeting(classItem.meet_link);
    console.log('Joining video meeting:', classItem.meet_link);
  };

  const startClass = (classItem: ClassWithProfile) => {
    videoConferenceService.startMeeting(classItem.meet_link);
    console.log('Starting video meeting:', classItem.meet_link);
  };

  const isClassLive = (classDate: string, classTime: string) => {
    const classDateTime = new Date(`${classDate} ${classTime}`);
    const now = new Date();
    const classEndTime = new Date(classDateTime.getTime() + (60 * 60 * 1000)); // Assume 1 hour duration
    
    return now >= classDateTime && now <= classEndTime;
  };

  const quickActions = user?.role === 'admin' ? [
    { title: 'Schedule Class', icon: Calendar, href: '/schedule', color: 'bg-purple-500' },
    { title: 'Upload Materials', icon: FolderOpen, href: '/materials', color: 'bg-blue-500' },
    { title: 'Create Assignment', icon: FileText, href: '/assignments', color: 'bg-green-500' },
    { title: 'View Attendance', icon: Users, href: '/attendance', color: 'bg-orange-500' },
  ] : [
    { title: 'View Classes', icon: Video, href: '/schedule', color: 'bg-purple-500' },
    { title: 'View Assignments', icon: FileText, href: '/assignments', color: 'bg-blue-500' },
    { title: 'Download Materials', icon: FolderOpen, href: '/materials', color: 'bg-green-500' },
    { title: 'Chat', icon: MessageCircle, href: '/chat', color: 'bg-orange-500' },
  ];

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'application/pdf':
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'video/mp4':
      case 'video':
      case 'mp4':
        return <Video className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-purple-100">
                {user?.role === 'admin' 
                  ? 'Ready to inspire and educate your students today?' 
                  : 'Ready to learn something new today?'
                }
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.totalClasses}</div>
                <div className="text-sm text-purple-200">Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.totalAssignments}</div>
                <div className="text-sm text-purple-200">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.attendanceRate}%</div>
                <div className="text-sm text-purple-200">Attendance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-6 text-center">
                    <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Classes */}
        <Card className="bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>{user?.role === 'admin' ? 'Scheduled Classes' : 'Available Classes'}</span>
            </CardTitle>
            <CardDescription>
              {user?.role === 'admin' ? 'Your scheduled classes from Supabase' : 'Classes you can join via video conference'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((classItem) => {
                  const isLive = isClassLive(classItem.date, classItem.time);
                  return (
                    <div key={classItem.id} className="p-3 bg-white rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{classItem.title}</h4>
                            <p className="text-sm text-gray-600">{classItem.description}</p>
                            <p className="text-xs text-gray-500">
                              By: {classItem.profiles?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        {isLive && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <div className="font-semibold">{classItem.time}</div>
                          <div>{new Date(classItem.date).toLocaleDateString()}</div>
                        </div>
                        {user?.role === 'student' && (
                          <Button 
                            size="sm" 
                            onClick={() => joinClass(classItem)}
                            className={isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            {isLive ? 'Join Live' : 'Join Class'}
                          </Button>
                        )}
                        {user?.role === 'admin' && (
                          <Button 
                            size="sm" 
                            onClick={() => startClass(classItem)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Start Class
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {user?.role === 'admin' ? 'No classes scheduled' : 'No classes available'}
                  </p>
                  {user?.role === 'admin' && (
                    <p className="text-sm text-gray-500 mt-2">Create classes in the Schedule section</p>
                  )}
                </div>
              )}
            </div>
            <Link to="/schedule">
              <Button variant="outline" className="w-full mt-4">
                {user?.role === 'admin' ? 'Manage Classes' : 'View All Classes'}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card className="bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Recent Assignments</span>
            </CardTitle>
            <CardDescription>
              {user?.role === 'admin' ? 'Recently created assignments' : 'Your upcoming assignments'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        assignment.status === 'submitted' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        <FileText className={`h-5 w-5 ${
                          assignment.status === 'submitted' ? 'text-green-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">Due in {assignment.due}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'submitted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {assignment.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent assignments</p>
                </div>
              )}
            </div>
            <Link to="/assignments">
              <Button variant="outline" className="w-full mt-4">
                View All Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Materials */}
        <Card className="bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-purple-600" />
              <span>Recent Materials</span>
            </CardTitle>
            <CardDescription>Recently uploaded course materials from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMaterials.length > 0 ? (
                recentMaterials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {getFileIcon(material.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{material.title}</h4>
                        <p className="text-sm text-gray-600">{material.fileSize}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {material.webViewLink && (
                        <Button size="sm" variant="ghost" onClick={() => window.open(material.webViewLink, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => window.open(material.downloadUrl, '_blank')}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {user?.role === 'admin' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No materials uploaded yet</p>
                </div>
              )}
            </div>
            <Link to="/materials">
              <Button variant="outline" className="w-full mt-4">
                View All Materials
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Classes</p>
                <p className="text-3xl font-bold">{statistics.totalClasses}</p>
              </div>
              <Video className="h-12 w-12 text-purple-200" />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-200" />
              <span className="text-sm text-purple-100">Scheduled classes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Assignments</p>
                <p className="text-3xl font-bold">{statistics.totalAssignments}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-200" />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-200" />
              <span className="text-sm text-blue-100">Active assignments</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Attendance</p>
                <p className="text-3xl font-bold">{statistics.attendanceRate}%</p>
              </div>
              <Users className="h-12 w-12 text-green-200" />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-200" />
              <span className="text-sm text-green-100">Average rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Download</p>
                <p className="text-xl font-bold">Attendance</p>
              </div>
              <Download className="h-12 w-12 text-orange-200" />
            </div>
            <div className="mt-4">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-orange-100 hover:text-white hover:bg-orange-400/20"
                onClick={handleDownloadAttendance}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sheet
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100">Chat</p>
                <p className="text-xl font-bold">Discussion</p>
              </div>
              <MessageCircle className="h-12 w-12 text-pink-200" />
            </div>
            <div className="mt-4">
              <Link to="/chat">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-pink-100 hover:text-white hover:bg-pink-400/20"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Join Chat
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
