
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
import { Megaphone, Plus, Edit2, Trash2, Calendar } from 'lucide-react';

const EventAnnouncements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: ''
  });

  const { data: announcements = [], isLoading, refetch } = useQuery({
    queryKey: ['announcements'],
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

      setFormData({ title: '', description: '', event_date: '' });
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
      event_date: announcement.event_date
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

  const resetForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    setFormData({ title: '', description: '', event_date: '' });
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
          <p className="text-gray-600">Manage and view important announcements</p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Announcement
          </Button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Megaphone className="h-5 w-5 text-purple-600" />
              <span>{editingAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}</span>
            </CardTitle>
            <CardDescription>
              {editingAnnouncement ? 'Update announcement details' : 'Create a new announcement for students'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Announcement Title</label>
                  <Input
                    placeholder="e.g., Important: Exam Schedule Change"
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
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Textarea
                    placeholder="Announcement description and details"
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
                    onClick={resetForm}
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
          <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  <Badge variant="outline" className="mt-2 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(announcement.event_date).toLocaleDateString()}</span>
                  </Badge>
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
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{announcement.description}</p>
                <div className="text-xs text-gray-500">
                  Created: {new Date(announcement.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Get started by adding your first announcement' 
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
