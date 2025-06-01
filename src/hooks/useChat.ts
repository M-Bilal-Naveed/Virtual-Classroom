
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService, ChatMessageWithProfile } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Custom hook for managing chat functionality
 * Handles real-time messaging, sending messages, and chat state management
 * 
 * Features:
 * - Real-time message updates via Supabase
 * - Message sending with error handling
 * - Automatic scrolling to new messages
 * - Message search and filtering
 * - Admin actions (delete messages, clear chat)
 * 
 * @returns Object containing chat state and actions
 */
export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Fetch messages using React Query
  const { 
    data: messages = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => chatService.getMessages(),
    refetchInterval: false, // Disabled because we use real-time updates
    enabled: !!user, // Only fetch when user is authenticated
  });

  /**
   * Sets up real-time subscription for new messages
   * Automatically updates the React Query cache when new messages arrive
   */
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time chat subscription for user:', user.email);
    
    const channel = chatService.subscribeToMessages((newMessage: ChatMessageWithProfile) => {
      console.log('New real-time message received:', newMessage);
      
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
    });

    setRealtimeChannel(channel);

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time chat subscription...');
      chatService.unsubscribeFromMessages(channel);
      setRealtimeChannel(null);
    };
  }, [user, queryClient, toast]);

  /**
   * Sends a new message to the chat
   * @param message - The message content to send
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !user) return;

    try {
      console.log('Sending message:', message);
      await chatService.sendMessage(message.trim());
      
      toast({
        title: "Message sent!",
        description: "Your message has been sent to the chat.",
      });
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
   * @param messageId - ID of the message to delete
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    if (user?.role !== 'admin') return;

    try {
      await chatService.deleteMessage(messageId);
      
      // Update the query cache to remove the deleted message
      queryClient.setQueryData(['chat-messages'], (oldMessages: ChatMessageWithProfile[] = []) => {
        return oldMessages.filter(msg => msg.id !== messageId);
      });

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
  }, [user, queryClient, toast]);

  /**
   * Clears all messages from the chat (admin only)
   */
  const clearChat = useCallback(async () => {
    if (user?.role !== 'admin') return;

    try {
      await chatService.clearAllMessages();
      
      // Clear the query cache
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
   * Updates typing status for the current user
   */
  const updateTypingStatus = useCallback(async (typing: boolean) => {
    setIsTyping(typing);
    try {
      await chatService.updateTypingStatus(typing);
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, []);

  return {
    // State
    messages: filteredMessages,
    allMessages: messages,
    isLoading,
    error,
    searchTerm,
    isTyping,
    isConnected: !!realtimeChannel,
    
    // Actions
    sendMessage,
    deleteMessage,
    clearChat,
    setSearchTerm,
    updateTypingStatus,
    refetchMessages: refetch,
    
    // Computed values
    messageCount: messages.length,
    filteredMessageCount: filteredMessages.length,
    canDelete: user?.role === 'admin',
    canClear: user?.role === 'admin',
  };
};
