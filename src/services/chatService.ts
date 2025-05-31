
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export interface ChatMessageWithProfile extends ChatMessage {
  profiles: {
    name: string;
    avatar: string | null;
  } | null;
}

class ChatService {
  async getMessages(): Promise<ChatMessageWithProfile[]> {
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
      // Continue without profiles rather than throwing an error
    }

    // Combine messages with their profile data
    const messagesWithProfiles: ChatMessageWithProfile[] = messages.map(message => ({
      ...message,
      profiles: profiles?.find(profile => profile.id === message.user_id) || null
    }));

    return messagesWithProfiles;
  }

  async sendMessage(message: string, messageType: string = 'text'): Promise<ChatMessage> {
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!user) {
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

    return data;
  }

  // Subscribe to real-time messages
  subscribeToMessages(callback: (message: ChatMessageWithProfile) => void) {
    return supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data: message } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();
          
          if (message) {
            // Fetch the profile separately
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar')
              .eq('id', message.user_id)
              .single();
            
            const messageWithProfile: ChatMessageWithProfile = {
              ...message,
              profiles: profile || null
            };
            
            callback(messageWithProfile);
          }
        }
      )
      .subscribe();
  }
}

export const chatService = new ChatService();
