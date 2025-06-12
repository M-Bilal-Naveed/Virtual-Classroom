
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];

class EventService {
  async getEvents(): Promise<Event[]> {
    console.log('Fetching events from Supabase...');
    
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw new Error(error.message);
      }

      console.log('Successfully fetched', events?.length || 0, 'events');
      return events || [];
    } catch (error) {
      console.error('Error in getEvents:', error);
      return [];
    }
  }

  async createEvent(eventData: Omit<EventInsert, 'created_by'>): Promise<Event> {
    console.log('Creating event:', eventData);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw new Error(error.message);
    }

    console.log('Event created successfully:', data);
    return data;
  }

  async updateEvent(id: string, eventData: Partial<EventInsert>): Promise<Event> {
    console.log('Updating event:', id, eventData);
    
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error(error.message);
    }

    console.log('Event updated successfully:', data);
    return data;
  }

  async deleteEvent(id: string): Promise<void> {
    console.log('Deleting event:', id);
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw new Error(error.message);
    }

    console.log('Event deleted successfully');
  }
}

export const eventService = new EventService();
