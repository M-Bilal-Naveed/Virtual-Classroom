
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export interface ChatMessageWithProfile extends ChatMessage {
  profiles: {
    name: string;
    avatar: string | null;
    role: string;
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

  async getMessages(): Promise<ChatMessageWithProfile[]> {
    console.log('Fetching chat messages...');
    
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw new Error(messagesError.message);
      }

      // Fetch profiles separately and join manually
      const userIds = [...new Set(messages?.map(msg => msg.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar, role')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const messagesWithProfiles: ChatMessageWithProfile[] = (messages || []).map(message => ({
        ...message,
        profiles: profilesMap.get(message.user_id) || null
      }));

      console.log('Successfully fetched', messagesWithProfiles.length, 'messages');
      return messagesWithProfiles;
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

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

  subscribeToMessages(callback: (payload: RealtimePayload) => void): RealtimeChannel {
    console.log('Setting up real-time subscription for chat messages...');
    
    this.subscribers.push(callback);
    
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
              const { data: profile } = await supabase
                .from('profiles')
                .select('name, avatar, role')
                .eq('id', payload.new.user_id)
                .single();
              
              const messageWithProfile: ChatMessageWithProfile = {
                ...payload.new as ChatMessage,
                profiles: profile || null
              };
              
              const realtimePayload: RealtimePayload = {
                eventType: 'INSERT',
                new: messageWithProfile,
                old: payload.old as ChatMessage
              };
              
              this.subscribers.forEach(sub => sub(realtimePayload));
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
            
            const realtimePayload: RealtimePayload = {
              eventType: 'DELETE',
              new: payload.new as ChatMessageWithProfile,
              old: payload.old as ChatMessage
            };
            
            this.subscribers.forEach(sub => sub(realtimePayload));
          }
        );
        
      this.realtimeChannel.subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });
    }

    return this.realtimeChannel;
  }

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
