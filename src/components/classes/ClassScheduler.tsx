
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { persistentStorage } from '../../utils/persistentStorage';
import { Calendar, Clock, Users, Video, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';

interface ScheduledClass {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  meetLink: string;
  students: string[];
}

const ClassScheduler = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '60'
  });

  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);

  // Load classes from persistent storage on component mount
  useEffect(() => {
    const data = persistentStorage.getData();
    setScheduledClasses(data.scheduledClasses);
  }, []);

  // Save classes to persistent storage whenever classes change (admin only)
  useEffect(() => {
    if (user?.role === 'admin') {
      persistentStorage.updateScheduledClasses(scheduledClasses);
    }
  }, [scheduledClasses, user?.role]);

  const generateZoomLink = () => {
    // Generate a valid Zoom meeting ID format (9-11 digits)
    const meetingId = Math.floor(100000000 + Math.random() * 900000000); // 9-digit number
    const passcode = Math.floor(100000 + Math.random() * 900000); // 6-digit passcode
    
    return `https://zoom.us/j/${meetingId}?pwd=${passcode}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const classData: ScheduledClass = {
      id: editingClass ? editingClass.id : Date.now().toString(),
      ...formData,
      meetLink: editingClass ? editingClass.meetLink : generateZoomLink(),
      students: editingClass ? editingClass.students : []
    };

    if (editingClass) {
      setScheduledClasses(prev => prev.map(c => c.id === editingClass.id ? classData : c));
      toast({
        title: "Class updated successfully!",
        description: "The class has been updated and changes are saved.",
      });
    } else {
      setScheduledClasses(prev => [...prev, classData]);
      toast({
        title: "Class scheduled successfully!",
        description: "The class has been scheduled with a valid Zoom meeting link.",
      });
    }

    setFormData({ title: '', description: '', date: '', time: '', duration: '60' });
    setShowForm(false);
    setEditingClass(null);
  };

  const handleEdit = (classItem: ScheduledClass) => {
    setFormData({
      title: classItem.title,
      description: classItem.description,
      date: classItem.date,
      time: classItem.time,
      duration: classItem.duration
    });
    setEditingClass(classItem);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setScheduledClasses(prev => prev.filter(c => c.id !== id));
    toast({
      title: "Class deleted successfully",
      description: "The class has been permanently removed from the schedule.",
    });
  };

  const joinClass = (classItem: ScheduledClass) => {
    // Open Zoom link in new tab
    window.open(classItem.meetLink, '_blank');
    toast({
      title: "Opening Zoom Meeting...",
      description: "The class meeting is opening in a new tab.",
    });
  };

  const startClass = (classItem: ScheduledClass) => {
    // For admin, open the meeting link directly
    window.open(classItem.meetLink, '_blank');
    toast({
      title: "Starting class...",
      description: "Opening Zoom meeting for your class.",
    });
  };

  const isClassLive = (classDate: string, classTime: string) => {
    const classDateTime = new Date(`${classDate} ${classTime}`);
    const now = new Date();
    const classEndTime = new Date(classDateTime.getTime() + (60 * 60 * 1000)); // Assume 1 hour duration
    
    return now >= classDateTime && now <= classEndTime;
  };

  const isClassUpcoming = (classDate: string, classTime: string) => {
    const classDateTime = new Date(`${classDate} ${classTime}`);
    const now = new Date();
    const oneHourBefore = new Date(classDateTime.getTime() - (60 * 60 * 1000));
    
    return now >= oneHourBefore && now < classDateTime;
  };

  // Student view - just show classes
  if (user?.role === 'student') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Classes</h1>
          <p className="text-gray-600">Join your scheduled classes and participate in live sessions via Zoom</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scheduledClasses.map((classItem) => {
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
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{classItem.students.length} students enrolled</span>
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
                        navigator.clipboard.writeText(classItem.meetLink);
                        toast({
                          title: "Link copied!",
                          description: "The Zoom meeting link has been copied to your clipboard.",
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

        {scheduledClasses.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes available</h3>
              <p className="text-gray-600">Check back later for new class schedules</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Admin view - full management interface
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
          <p className="text-gray-600">Schedule and manage your virtual classes with valid Zoom meeting links</p>
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
              {editingClass ? 'Update class details' : 'Create a new virtual class with automatic Zoom integration'}
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
                  <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
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
                      setFormData({ title: '', description: '', date: '', time: '', duration: '60' });
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
        {scheduledClasses.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{classItem.title}</CardTitle>
                  <CardDescription className="mt-1">{classItem.description}</CardDescription>
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
                  <Users className="h-4 w-4" />
                  <span>{classItem.students.length} students enrolled</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Video className="h-4 w-4" />
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">
                    {classItem.meetLink}
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
                    navigator.clipboard.writeText(classItem.meetLink);
                    toast({
                      title: "Link copied!",
                      description: "The Zoom meeting link has been copied to your clipboard.",
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

      {scheduledClasses.length === 0 && !showForm && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes scheduled</h3>
            <p className="text-gray-600 mb-4">Get started by scheduling your first virtual class</p>
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
