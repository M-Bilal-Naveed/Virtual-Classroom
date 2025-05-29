
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { persistentStorage } from '../../utils/persistentStorage';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  BookOpen,
  ExternalLink
} from 'lucide-react';

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

const StudentClassView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ScheduledClass[]>([]);

  useEffect(() => {
    const data = persistentStorage.getData();
    setClasses(data.scheduledClasses || []);
  }, []);

  const joinClass = (classItem: ScheduledClass) => {
    // Open Zoom link in new tab
    window.open(classItem.meetLink, '_blank');
    toast({
      title: "Opening Zoom Meeting...",
      description: "The class meeting is opening in a new tab.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Classes</h1>
        <p className="text-gray-600">Join your scheduled classes and participate in live sessions via Zoom</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => {
          const isLive = isClassLive(classItem.date, classItem.time);
          const isUpcoming = isClassUpcoming(classItem.date, classItem.time);
          const classDateTime = new Date(`${classItem.date} ${classItem.time}`);
          const isPast = new Date() > classDateTime;

          return (
            <Card key={classItem.id} className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{classItem.title}</CardTitle>
                  <div className="flex flex-col space-y-1">
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
                  </div>
                </div>
                <CardDescription>{classItem.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(classItem.date)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(classItem.time)} ({classItem.duration} minutes)</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{classItem.students?.length || 0} students enrolled</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {(isLive || isUpcoming) && (
                    <Button 
                      onClick={() => joinClass(classItem)}
                      className={`w-full ${isLive 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {isLive ? 'Join Live Class' : 'Join Class'}
                    </Button>
                  )}
                  
                  <Link to={`/live-class/${classItem.id}`}>
                    <Button variant="outline" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Class Details
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm"
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

      {classes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes available</h3>
            <p className="text-gray-600">Check back later for new class schedules</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentClassView;
