
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, ChatMessageWithProfile } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const { 
    data: messages = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => chatService.getMessages(),
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Auto-refresh after sending message
  const autoRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, [refetch]);

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    console.log('Setting up real-time chat subscription for user:', user.id);
    
    const channel = chatService.subscribeToMessages((payload) => {
      console.log('Real-time event received:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as ChatMessageWithProfile;
        
        queryClient.setQueryData(['chat-messages'], (oldMessages: ChatMessageWithProfile[] = []) => {
          const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            return oldMessages;
          }
          
          return [...oldMessages, newMessage];
        });

        if (newMessage.user_id !== user.id) {
          toast({
            title: `New message from ${newMessage.profiles?.name || 'Someone'}`,
            description: newMessage.message.length > 50 
              ? newMessage.message.substring(0, 50) + '...'
              : newMessage.message,
          });
        }
      } else if (payload.eventType === 'DELETE') {
        const deletedMessage = payload.old;
        queryClient.setQueryData(['chat-messages'], (oldMessages: ChatMessageWithProfile[] = []) => {
          return oldMessages.filter(msg => msg.id !== deletedMessage.id);
        });
      }
    });

    if (channel) {
      setIsConnected(true);
    }

    return () => {
      console.log('Cleaning up real-time chat subscription...');
      if (channel) {
        chatService.unsubscribeFromMessages(channel);
      }
      setIsConnected(false);
    };
  }, [user, queryClient, toast]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !user) return;

    try {
      console.log('Sending message from user:', user.id, message);
      await chatService.sendMessage(message.trim());
      console.log('Message sent successfully');
      
      // Auto-refresh after sending
      setTimeout(autoRefresh, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast, autoRefresh]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      toast({
        title: "Message deleted",
        description: "Your message has been deleted.",
      });
      
      // Auto-refresh after deleting
      setTimeout(autoRefresh, 100);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, autoRefresh]);

  const clearChat = useCallback(async () => {
    if (user?.role !== 'admin') return;

    try {
      await chatService.clearAllMessages();
      queryClient.setQueryData(['chat-messages'], []);
      toast({
        title: "Chat cleared",
        description: "All messages have been removed from the chat.",
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, queryClient, toast]);

  const filteredMessages = messages.filter(msg =>
    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.profiles?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const refreshMessages = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  }, [refetch]);

  return {
    messages: filteredMessages,
    allMessages: messages,
    isLoading,
    error,
    searchTerm,
    isConnected,
    sendMessage,
    deleteMessage,
    clearChat,
    setSearchTerm,
    refreshMessages,
    messageCount: messages.length,
    filteredMessageCount: filteredMessages.length,
    canDelete: user?.role === 'admin',
    canClear: user?.role === 'admin',
  };
};
