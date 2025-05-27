import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
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
  Bell
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const upcomingClasses = [
    { id: 1, title: 'Mathematics', time: '10:00 AM', date: 'Today', instructor: 'Dr. Smith' },
    { id: 2, title: 'Physics', time: '2:00 PM', date: 'Today', instructor: 'Prof. Johnson' },
    { id: 3, title: 'Chemistry', time: '11:00 AM', date: 'Tomorrow', instructor: 'Dr. Brown' },
  ];

  const recentAssignments = [
    { id: 1, title: 'Linear Algebra Problem Set', due: '2 days', status: 'pending' },
    { id: 2, title: 'Physics Lab Report', due: '5 days', status: 'submitted' },
    { id: 3, title: 'Chemistry Research Paper', due: '1 week', status: 'pending' },
  ];

  const quickActions = user?.role === 'admin' ? [
    { title: 'Schedule Class', icon: Calendar, href: '/schedule', color: 'bg-purple-500' },
    { title: 'Upload Materials', icon: FolderOpen, href: '/materials', color: 'bg-blue-500' },
    { title: 'Create Assignment', icon: FileText, href: '/assignments', color: 'bg-green-500' },
    { title: 'View Attendance', icon: Users, href: '/attendance', color: 'bg-orange-500' },
  ] : [
    { title: 'Join Class', icon: Video, href: '/dashboard', color: 'bg-purple-500' },
    { title: 'View Assignments', icon: FileText, href: '/assignments', color: 'bg-blue-500' },
    { title: 'Download Materials', icon: FolderOpen, href: '/materials', color: 'bg-green-500' },
    { title: 'Chat', icon: MessageCircle, href: '/chat', color: 'bg-orange-500' },
  ];

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
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm text-purple-200">Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-purple-200">Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">95%</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Classes */}
        <Card className="bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Upcoming Classes</span>
            </CardTitle>
            <CardDescription>Your schedule for today and tomorrow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.map((classItem) => (
                <div key={classItem.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{classItem.title}</h4>
                      <p className="text-sm text-gray-600">{classItem.instructor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{classItem.time}</div>
                    <div className="text-sm text-gray-600">{classItem.date}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Classes
            </Button>
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
              {user?.role === 'admin' ? 'Assignments you\'ve created' : 'Your pending and submitted work'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssignments.map((assignment) => (
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
              ))}
            </div>
            <Link to="/assignments">
              <Button variant="outline" className="w-full mt-4">
                View All Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Classes</p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <Video className="h-12 w-12 text-purple-200" />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-200" />
              <span className="text-sm text-purple-100">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Assignments</p>
                <p className="text-3xl font-bold">18</p>
              </div>
              <FileText className="h-12 w-12 text-blue-200" />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-200" />
              <span className="text-sm text-blue-100">+8% completion rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Attendance</p>
                <p className="text-3xl font-bold">94%</p>
              </div>
              <Users className="h-12 w-12 text-green-200" />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-200" />
              <span className="text-sm text-green-100">+2% this week</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
