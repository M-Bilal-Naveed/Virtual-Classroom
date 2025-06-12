
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventAnnouncement = Database['public']['Tables']['event_announcements']['Row'];
type EventAnnouncementInsert = Database['public']['Tables']['event_announcements']['Insert'];

class AnnouncementService {
  async getAnnouncements(): Promise<EventAnnouncement[]> {
    console.log('Fetching event announcements from Supabase...');
    
    try {
      // First, clean up expired announcements
      await this.cleanupExpiredAnnouncements();

      const { data: announcements, error } = await supabase
        .from('event_announcements')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching announcements:', error);
        throw new Error(error.message);
      }

      console.log('Successfully fetched', announcements?.length || 0, 'announcements');
      return announcements || [];
    } catch (error) {
      console.error('Error in getAnnouncements:', error);
      return [];
    }
  }

  async createAnnouncement(announcementData: Omit<EventAnnouncementInsert, 'created_by'>): Promise<EventAnnouncement> {
    console.log('Creating announcement:', announcementData);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('event_announcements')
      .insert({
        ...announcementData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      throw new Error(error.message);
    }

    console.log('Announcement created successfully:', data);
    return data;
  }

  async updateAnnouncement(id: string, announcementData: Partial<EventAnnouncementInsert>): Promise<EventAnnouncement> {
    console.log('Updating announcement:', id, announcementData);
    
    const { data, error } = await supabase
      .from('event_announcements')
      .update(announcementData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      throw new Error(error.message);
    }

    console.log('Announcement updated successfully:', data);
    return data;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    console.log('Deleting announcement:', id);
    
    const { error } = await supabase
      .from('event_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      throw new Error(error.message);
    }

    console.log('Announcement deleted successfully');
  }

  async cleanupExpiredAnnouncements(): Promise<void> {
    console.log('Cleaning up expired announcements...');
    
    try {
      const { error } = await supabase
        .from('event_announcements')
        .delete()
        .lt('event_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error cleaning up expired announcements:', error);
      } else {
        console.log('Successfully cleaned up expired announcements');
      }
    } catch (error) {
      console.error('Error in cleanupExpiredAnnouncements:', error);
    }
  }
}

export const announcementService = new AnnouncementService();
