
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { eventService } from '../../services/eventService';
import { Calendar, Clock, Plus, Edit2, Trash2, Upload, Image } from 'lucide-react';

const EventCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: ''
  });

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents(),
    enabled: !!user,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, formData);
        toast({
          title: "Event updated successfully!",
          description: "The event has been updated and saved to database.",
        });
      } else {
        await eventService.createEvent(formData);
        toast({
          title: "Event created successfully!",
          description: "The event has been saved to database.",
        });
      }

      setFormData({ title: '', description: '', event_date: '', start_time: '', end_time: '' });
      setSelectedImage(null);
      setImagePreview(null);
      setShowForm(false);
      setEditingEvent(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time
    });
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await eventService.deleteEvent(id);
      toast({
        title: "Event deleted successfully",
        description: "The event has been permanently removed from the database.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({ title: '', description: '', event_date: '', start_time: '', end_time: '' });
    setSelectedImage(null);
    setImagePreview(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Calendar</h1>
          <p className="text-gray-600">Manage and view upcoming events</p>
        </div>
        {user?.role === 'admin' && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Event
          </Button>
        )}
      </div>

      {showForm && user?.role === 'admin' && (
        <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span>{editingEvent ? 'Edit Event' : 'Add New Event'}</span>
            </CardTitle>
            <CardDescription>
              {editingEvent ? 'Update event details' : 'Create a new event for the calendar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Event Title</label>
                  <Input
                    placeholder="e.g., School Science Fair"
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Start Time</label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">End Time</label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Textarea
                    placeholder="Event description and details"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Event Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="event-image"
                    />
                    <label htmlFor="event-image" className="cursor-pointer">
                      {imagePreview ? (
                        <div className="text-center">
                          <img src={imagePreview} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-lg mb-2" />
                          <p className="text-sm text-gray-600">Click to change image</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-600">Click to upload image</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingEvent ? 'Update Event' : 'Create Event'}
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
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {new Date(event.event_date).toLocaleDateString()}
                  </Badge>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(event)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {event.description && (
                  <p className="text-sm text-gray-600">{event.description}</p>
                )}
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{event.start_time} - {event.end_time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events scheduled</h3>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Get started by adding your first event' 
                : 'Check back later for upcoming events'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventCalendar;
