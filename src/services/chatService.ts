
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
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles (name, avatar)
      `)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(error.message);
    }

    return data as ChatMessageWithProfile[];
  }

  async sendMessage(message: string, messageType: string = 'text'): Promise<ChatMessage> {
    const user = (await supabase.auth.getUser()).data.user;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user?.id!,
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
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              profiles (name, avatar)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            callback(data as ChatMessageWithProfile);
          }
        }
      )
      .subscribe();
  }
}

export const chatService = new ChatService();
