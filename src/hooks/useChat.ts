
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
 * - Persistent real-time connection across navigation
 * 
 * @returns Object containing chat state and actions
 */
export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch messages using React Query with aggressive caching
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
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  /**
   * Sets up real-time subscription for new messages
   * Automatically updates the React Query cache when new messages arrive
   */
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    console.log('Setting up real-time chat subscription for user:', user.email);
    
    const channel = chatService.subscribeToMessages((payload) => {
      console.log('Real-time event received:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as ChatMessageWithProfile;
        
        // Update the query cache with the new message
        queryClient.setQueryData(['chat-messages'], (oldMessages: ChatMessageWithProfile[] = []) => {
          // Check if message already exists to avoid duplicates
          const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            console.log('Message already exists, skipping duplicate');
            return oldMessages;
          }
          
          console.log('Adding new message to cache:', newMessage);
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

    // Set connection status based on subscription
    if (channel) {
      setIsConnected(true);
      
      // Listen for connection status changes
      channel.subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
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
   * @param message - The message content to send
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !user) return;

    try {
      console.log('Sending message:', message);
      await chatService.sendMessage(message.trim());
      
      // Don't add to cache here - let real-time handle it
      console.log('Message sent successfully, waiting for real-time update');
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
      
      // Real-time will handle the cache update via DELETE event
      console.log('Message deletion initiated, waiting for real-time update');
      
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
      
      // Clear the query cache immediately for better UX
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
    isTyping,
    isConnected,
    
    // Actions
    sendMessage,
    deleteMessage,
    clearChat,
    setSearchTerm,
    updateTypingStatus,
    refreshMessages,
    
    // Computed values
    messageCount: messages.length,
    filteredMessageCount: filteredMessages.length,
    canDelete: user?.role === 'admin',
    canClear: user?.role === 'admin',
  };
};
