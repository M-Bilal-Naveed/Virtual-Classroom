
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export interface ChatMessageWithProfile extends ChatMessage {
  profiles: {
    name: string;
    avatar: string | null;
  } | null;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: ChatMessageWithProfile;
  old: ChatMessage;
}

class ChatService {
  private realtimeChannel: RealtimeChannel | null = null;
  private subscribers: ((payload: RealtimePayload) => void)[] = [];

  /**
   * Fetches all chat messages with user profile information
   */
  async getMessages(): Promise<ChatMessageWithProfile[]> {
    console.log('Fetching chat messages...');
    
    try {
      // Get all chat messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw new Error(messagesError.message);
      }

      if (!messages || messages.length === 0) {
        console.log('No messages found');
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(messages.map(msg => msg.user_id))];

      // Fetch profiles for all unique users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine messages with their profile data
      const messagesWithProfiles: ChatMessageWithProfile[] = messages.map(message => ({
        ...message,
        profiles: profiles?.find(profile => profile.id === message.user_id) || null
      }));

      console.log('Successfully fetched', messagesWithProfiles.length, 'messages');
      return messagesWithProfiles;
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  /**
   * Sends a new chat message to the database
   */
  async sendMessage(message: string, messageType: string = 'text'): Promise<ChatMessage> {
    console.log('Sending message:', message);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        message,
        message_type: messageType
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw new Error(error.message);
    }

    console.log('Message sent successfully:', data);
    return data;
  }

  /**
   * Deletes a chat message (admin only)
   */
  async deleteMessage(messageId: string): Promise<void> {
    console.log('Deleting message:', messageId);
    
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw new Error(error.message);
    }

    console.log('Message deleted successfully');
  }

  /**
   * Clears all chat messages (admin only)
   */
  async clearAllMessages(): Promise<void> {
    console.log('Clearing all chat messages...');
    
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error clearing messages:', error);
      throw new Error(error.message);
    }

    console.log('All messages cleared successfully');
  }

  /**
   * Subscribes to real-time chat message updates
   */
  subscribeToMessages(callback: (payload: RealtimePayload) => void): RealtimeChannel {
    console.log('Setting up real-time subscription for chat messages...');
    
    // Add callback to subscribers list
    this.subscribers.push(callback);
    
    // Only create one channel for all subscribers
    if (!this.realtimeChannel) {
      this.realtimeChannel = supabase
        .channel('chat_messages_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
          },
          async (payload) => {
            console.log('Real-time INSERT event received:', payload);
            
            try {
              // Fetch the complete message data with profile
              const { data: message } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('id', payload.new.id)
                .single();
              
              if (message) {
                // Fetch the user profile separately
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('name, avatar')
                  .eq('id', message.user_id)
                  .single();
                
                const messageWithProfile: ChatMessageWithProfile = {
                  ...message,
                  profiles: profile || null
                };
                
                // Notify all subscribers
                const realtimePayload: RealtimePayload = {
                  eventType: 'INSERT',
                  new: messageWithProfile,
                  old: payload.old as ChatMessage
                };
                
                this.subscribers.forEach(sub => sub(realtimePayload));
              }
            } catch (error) {
              console.error('Error processing real-time INSERT:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_messages'
          },
          (payload) => {
            console.log('Real-time DELETE event received:', payload);
            
            // Notify all subscribers
            const realtimePayload: RealtimePayload = {
              eventType: 'DELETE',
              new: payload.new as ChatMessageWithProfile,
              old: payload.old as ChatMessage
            };
            
            this.subscribers.forEach(sub => sub(realtimePayload));
          }
        );
        
      // Subscribe to the channel
      this.realtimeChannel.subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });
    }

    return this.realtimeChannel;
  }

  /**
   * Unsubscribes from real-time chat updates
   */
  unsubscribeFromMessages(channel: RealtimeChannel): void {
    console.log('Unsubscribing from real-time chat messages...');
    
    if (channel) {
      supabase.removeChannel(channel);
    }
    
    if (this.realtimeChannel === channel) {
      this.realtimeChannel = null;
      this.subscribers = [];
    }
  }
}

export const chatService = new ChatService();
