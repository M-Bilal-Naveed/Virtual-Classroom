
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Calendar, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-600">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
      
      <Card className="bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Your account details and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={user.avatar || ''} 
                  alt={user.name || 'User Avatar'} 
                />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-sm">
                {user.role === 'admin' ? 'Teacher' : 'Student'}
              </Badge>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Full Name</span>
                  </label>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-gray-900">{user.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </label>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Role</span>
                  </label>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-gray-900 capitalize">
                      {user.role === 'admin' ? 'Teacher/Administrator' : 'Student'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Member Since</span>
                  </label>
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Account Status</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-blue-800">Active Account</span>
                </div>
                {user.lastLogin && (
                  <p className="text-sm text-blue-700 mt-2">
                    Last login: {new Date(user.lastLogin).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
