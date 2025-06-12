
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementService } from '../../services/announcementService';
import { Megaphone, Calendar, Plus, Edit2, Trash2, Upload } from 'lucide-react';

const EventAnnouncements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    image_url: ''
  });

  const { data: announcements = [], isLoading, refetch } = useQuery({
    queryKey: ['event-announcements'],
    queryFn: () => announcementService.getAnnouncements(),
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAnnouncement) {
        await announcementService.updateAnnouncement(editingAnnouncement.id, formData);
        toast({
          title: "Announcement updated successfully!",
          description: "The announcement has been updated and saved to database.",
        });
      } else {
        await announcementService.createAnnouncement(formData);
        toast({
          title: "Announcement created successfully!",
          description: "The announcement has been saved to database.",
        });
      }

      setFormData({ title: '', description: '', event_date: '', image_url: '' });
      setShowForm(false);
      setEditingAnnouncement(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (announcement: any) => {
    setFormData({
      title: announcement.title,
      description: announcement.description || '',
      event_date: announcement.event_date,
      image_url: announcement.image_url || ''
    });
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await announcementService.deleteAnnouncement(id);
      toast({
        title: "Announcement deleted successfully",
        description: "The announcement has been permanently removed from the database.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isEventToday = (eventDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  };

  const isEventUpcoming = (eventDate: string) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading announcements...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Announcements</h1>
          <p className="text-gray-600">Stay updated with upcoming events and announcements</p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <Card className="mb-8 bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Megaphone className="h-5 w-5 text-orange-600" />
              <span>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</span>
            </CardTitle>
            <CardDescription>
              {editingAnnouncement ? 'Update announcement details' : 'Create a new event announcement with image'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Announcement Title</label>
                  <Input
                    placeholder="e.g., Annual Sports Day 2024"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Event Date</label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Image URL (Optional)</label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Textarea
                    placeholder="Event details, time, venue, and other important information"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingAnnouncement(null);
                      setFormData({ title: '', description: '', event_date: '', image_url: '' });
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {announcement.image_url && (
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${announcement.image_url})` }}>
                <div className="h-full bg-black bg-opacity-40 flex items-end p-4">
                  <div className="text-white">
                    {isEventToday(announcement.event_date) && (
                      <Badge className="bg-red-500 text-white mb-2">Today!</Badge>
                    )}
                    {isEventUpcoming(announcement.event_date) && !isEventToday(announcement.event_date) && (
                      <Badge className="bg-orange-500 text-white mb-2">Upcoming</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(announcement.event_date).toLocaleDateString()}
                    </span>
                    {!announcement.image_url && isEventToday(announcement.event_date) && (
                      <Badge className="bg-red-500 text-white ml-2">Today!</Badge>
                    )}
                    {!announcement.image_url && isEventUpcoming(announcement.event_date) && !isEventToday(announcement.event_date) && (
                      <Badge className="bg-orange-500 text-white ml-2">Upcoming</Badge>
                    )}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(announcement)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(announcement.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{announcement.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements</h3>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Create your first event announcement' 
                : 'Check back later for new announcements'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventAnnouncements;
