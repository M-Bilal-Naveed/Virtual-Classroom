
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, ChatMessageWithProfile } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for managing chat functionality
 * Handles real-time messaging, sending messages, and chat state management
 */
export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Fetch messages using React Query
  const { 
    data: messages = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => chatService.getMessages(),
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  /**
   * Sets up real-time subscription for new messages
   */
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    console.log('Setting up real-time chat subscription...');
    
    const channel = chatService.subscribeToMessages((payload) => {
      console.log('Real-time event received:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as ChatMessageWithProfile;
        
        // Update the query cache with the new message
        queryClient.setQueryData(['chat-messages'], (oldMessages: ChatMessageWithProfile[] = []) => {
          // Check if message already exists to avoid duplicates
          const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            return oldMessages;
          }
          
          return [...oldMessages, newMessage];
        });

        // Show toast notification for messages from other users
        if (newMessage.user_id !== user.id) {
          toast({
            title: `New message from ${newMessage.profiles?.name || 'Unknown'}`,
            description: newMessage.message.length > 50 
              ? newMessage.message.substring(0, 50) + '...'
              : newMessage.message,
          });
        }
      } else if (payload.eventType === 'DELETE') {
        // Handle message deletion
        const deletedMessage = payload.old;
        queryClient.setQueryData(['chat-messages'], (oldMessages: ChatMessageWithProfile[] = []) => {
          return oldMessages.filter(msg => msg.id !== deletedMessage.id);
        });
      }
    });

    if (channel) {
      setIsConnected(true);
    }

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time chat subscription...');
      if (channel) {
        chatService.unsubscribeFromMessages(channel);
      }
      setIsConnected(false);
    };
  }, [user, queryClient, toast]);

  /**
   * Sends a new message to the chat
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !user) return;

    try {
      console.log('Sending message:', message);
      await chatService.sendMessage(message.trim());
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  /**
   * Deletes a message (admin only)
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    if (user?.role !== 'admin') return;

    try {
      await chatService.deleteMessage(messageId);
      toast({
        title: "Message deleted",
        description: "The message has been removed from the chat.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  /**
   * Clears all messages from the chat (admin only)
   */
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

  /**
   * Filters messages based on search term
   */
  const filteredMessages = messages.filter(msg =>
    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.profiles?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Force refresh messages from server
   */
  const refreshMessages = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  }, [refetch]);

  return {
    // State
    messages: filteredMessages,
    allMessages: messages,
    isLoading,
    error,
    searchTerm,
    isConnected,
    
    // Actions
    sendMessage,
    deleteMessage,
    clearChat,
    setSearchTerm,
    refreshMessages,
    
    // Computed values
    messageCount: messages.length,
    filteredMessageCount: filteredMessages.length,
    canDelete: user?.role === 'admin',
    canClear: user?.role === 'admin',
  };
};
