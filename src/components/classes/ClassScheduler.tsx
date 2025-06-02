
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { classService, ClassWithProfile } from '../../services/classService';
import { videoConferenceService } from '../../services/videoConferenceService';
import { Calendar, Clock, Users, Video, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';

const ClassScheduler = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithProfile | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60
  });

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classService.getClasses(),
    enabled: !!user,
  });

  const generateMeetingLink = (classId: string, title: string) => {
    return videoConferenceService.createDirectMeetingUrl(classId, title);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const classData = {
        title: formData.title,
        description: formData.description || '',
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        meet_link: editingClass ? editingClass.meet_link : generateMeetingLink(Date.now().toString(), formData.title)
      };

      if (editingClass) {
        await classService.updateClass(editingClass.id, classData);
        toast({
          title: "Class updated successfully!",
          description: "The class has been updated and saved to database.",
        });
      } else {
        await classService.createClass(classData);
        toast({
          title: "Class scheduled successfully!",
          description: "The class has been saved to database with a video conference link.",
        });
      }

      setFormData({ title: '', description: '', date: '', time: '', duration: 60 });
      setShowForm(false);
      setEditingClass(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (classItem: ClassWithProfile) => {
    setFormData({
      title: classItem.title,
      description: classItem.description || '',
      date: classItem.date,
      time: classItem.time,
      duration: classItem.duration
    });
    setEditingClass(classItem);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await classService.deleteClass(id);
      toast({
        title: "Class deleted successfully",
        description: "The class has been permanently removed from the database.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive",
      });
    }
  };

  const joinClass = (classItem: ClassWithProfile) => {
    videoConferenceService.joinMeeting(classItem.meet_link);
    toast({
      title: "Opening Video Conference...",
      description: "The class meeting is opening in a new window.",
    });
  };

  const startClass = (classItem: ClassWithProfile) => {
    videoConferenceService.startMeeting(classItem.meet_link);
    toast({
      title: "Starting class...",
      description: "Opening video conference for your class.",
    });
  };

  const isClassLive = (classDate: string, classTime: string) => {
    const classDateTime = new Date(`${classDate} ${classTime}`);
    const now = new Date();
    const classEndTime = new Date(classDateTime.getTime() + (60 * 60 * 1000));
    
    return now >= classDateTime && now <= classEndTime;
  };

  const isClassUpcoming = (classDate: string, classTime: string) => {
    const classDateTime = new Date(`${classDate} ${classTime}`);
    const now = new Date();
    const oneHourBefore = new Date(classDateTime.getTime() - (60 * 60 * 1000));
    
    return now >= oneHourBefore && now < classDateTime;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading classes...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Student view
  if (user?.role === 'student') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Classes</h1>
          <p className="text-gray-600">Join your scheduled classes from the database</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {classes.map((classItem) => {
            const isLive = isClassLive(classItem.date, classItem.time);
            const isUpcoming = isClassUpcoming(classItem.date, classItem.time);
            const classDateTime = new Date(`${classItem.date} ${classItem.time}`);
            const isPast = new Date() > classDateTime;

            return (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{classItem.title}</span>
                        {isLive && (
                          <Badge variant="destructive" className="animate-pulse">
                            LIVE
                          </Badge>
                        )}
                        {isUpcoming && !isLive && (
                          <Badge variant="default" className="bg-orange-500">
                            Starting Soon
                          </Badge>
                        )}
                        {isPast && !isLive && (
                          <Badge variant="secondary">
                            Ended
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{classItem.description}</CardDescription>
                      <p className="text-xs text-gray-500 mt-1">
                        Created by: {classItem.profiles?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(classItem.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{classItem.time} ({classItem.duration} minutes)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => joinClass(classItem)}
                      className={`w-full ${isLive 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {isLive ? 'Join Live Class' : 'Join Class'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(classItem.meet_link);
                        toast({
                          title: "Link copied!",
                          description: "The meeting link has been copied to your clipboard.",
                        });
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Copy Meeting Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {classes.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes available</h3>
              <p className="text-gray-600">Check back later for new class schedules from database</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Admin view
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">Only administrators can manage class schedules.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Scheduler</h1>
          <p className="text-gray-600">Schedule and manage classes in Supabase database</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule New Class
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span>{editingClass ? 'Edit Class' : 'Schedule New Class'}</span>
            </CardTitle>
            <CardDescription>
              {editingClass ? 'Update class details in database' : 'Create a new class in Supabase database'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Class Title</label>
                  <Input
                    placeholder="e.g., Mathematics - Calculus"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Time</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Textarea
                    placeholder="Brief description of the class content"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Duration (minutes)</label>
                  <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-4 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingClass ? 'Update Class' : 'Schedule Class'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingClass(null);
                      setFormData({ title: '', description: '', date: '', time: '', duration: 60 });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{classItem.title}</CardTitle>
                  <CardDescription className="mt-1">{classItem.description}</CardDescription>
                  <p className="text-xs text-gray-500 mt-1">
                    Created by: {classItem.profiles?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(classItem)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(classItem.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(classItem.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{classItem.time} ({classItem.duration} minutes)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Video className="h-4 w-4" />
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                    Stored in Database
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex space-x-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700" 
                  onClick={() => startClass(classItem)}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Start Class
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(classItem.meet_link);
                    toast({
                      title: "Link copied!",
                      description: "The meeting link has been copied to your clipboard.",
                    });
                  }}
                >
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && !showForm && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes scheduled</h3>
            <p className="text-gray-600 mb-4">Get started by scheduling your first class in database</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Class
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassScheduler;
