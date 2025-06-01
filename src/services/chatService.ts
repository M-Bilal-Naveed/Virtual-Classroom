
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

class ChatService {
  private realtimeChannel: RealtimeChannel | null = null;

  /**
   * Fetches all chat messages with user profile information
   * Uses separate queries to avoid join issues with Supabase
   */
  async getMessages(): Promise<ChatMessageWithProfile[]> {
    console.log('Fetching chat messages...');
    
    // First, get all chat messages
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
    console.log('Fetching profiles for users:', userIds);

    // Fetch profiles for all unique users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profiles rather than throwing an error
    }

    // Combine messages with their profile data
    const messagesWithProfiles: ChatMessageWithProfile[] = messages.map(message => ({
      ...message,
      profiles: profiles?.find(profile => profile.id === message.user_id) || null
    }));

    console.log('Successfully fetched', messagesWithProfiles.length, 'messages');
    return messagesWithProfiles;
  }

  /**
   * Sends a new chat message to the database
   * @param message - The message content
   * @param messageType - Type of message (default: 'text')
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
   * @param messageId - ID of the message to delete
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
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      console.error('Error clearing messages:', error);
      throw new Error(error.message);
    }

    console.log('All messages cleared successfully');
  }

  /**
   * Subscribes to real-time chat message updates
   * @param callback - Function to call when new messages arrive
   * @returns RealtimeChannel for cleanup
   */
  subscribeToMessages(callback: (message: ChatMessageWithProfile) => void): RealtimeChannel {
    console.log('Setting up real-time subscription for chat messages...');
    
    // Clean up existing subscription if any
    if (this.realtimeChannel) {
      this.unsubscribeFromMessages(this.realtimeChannel);
    }

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
            // Fetch the complete message data
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
              
              console.log('Calling callback with new message:', messageWithProfile);
              callback(messageWithProfile);
            }
          } catch (error) {
            console.error('Error processing real-time message:', error);
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
          // Handle message deletion if needed
          // This could trigger a refresh of the messages list
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return this.realtimeChannel;
  }

  /**
   * Unsubscribes from real-time chat updates
   * @param channel - The RealtimeChannel to unsubscribe from
   */
  unsubscribeFromMessages(channel: RealtimeChannel): void {
    console.log('Unsubscribing from real-time chat messages...');
    
    if (channel) {
      supabase.removeChannel(channel);
    }
    
    if (this.realtimeChannel === channel) {
      this.realtimeChannel = null;
    }
  }

  /**
   * Gets the current user's typing status and manages typing indicators
   * This is a placeholder for future typing indicator functionality
   */
  async updateTypingStatus(isTyping: boolean): Promise<void> {
    // This would use Supabase presence to track typing status
    // Implementation would depend on specific requirements
    console.log('Typing status updated:', isTyping);
  }

  /**
   * Gets online users count using Supabase presence
   * This is a placeholder for future presence functionality
   */
  async getOnlineUsers(): Promise<number> {
    // This would use Supabase presence to track online users
    // Implementation would depend on specific requirements
    console.log('Getting online users count');
    return 0;
  }
}

export const chatService = new ChatService();
