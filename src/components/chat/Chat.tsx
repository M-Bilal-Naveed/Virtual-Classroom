
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { chatService, ChatMessageWithProfile } from '../../services/chatService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  MessageCircle, 
  Send, 
  Smile,
  Paperclip,
  Search,
  MoreVertical,
  Trash2
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages using React Query
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => chatService.getMessages(),
    refetchInterval: false, // Disable polling since we use real-time
  });

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time chat subscription...');
    
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
      if (newMessage.user_id !== user?.id) {
        toast({
          title: `New message from ${newMessage.profiles?.name || 'Unknown'}`,
          description: newMessage.message,
        });
      }
    });

    return () => {
      console.log('Cleaning up real-time chat subscription...');
      chatService.unsubscribeFromMessages(channel);
    };
  }, [user?.id, queryClient, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      console.log('Sending message:', message);
      await chatService.sendMessage(message.trim());
      setMessage('');
      
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
  };

  const handleDeleteMessage = async (messageId: string) => {
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredMessages = messages.filter(msg =>
    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.profiles?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearChat = async () => {
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
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-[600px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <span>Class Discussion</span>
                <Badge variant="outline">{messages.length} messages</Badge>
              </CardTitle>
              <CardDescription>Real-time chat for Virtual Classroom</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {user?.role === 'admin' && (
                <Button size="sm" variant="ghost" onClick={clearChat}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {filteredMessages.map((msg, index) => {
                const isOwnMessage = msg.user_id === user?.id;
                const showAvatar = index === 0 || filteredMessages[index - 1].user_id !== msg.user_id;
                
                return (
                  <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
                      {showAvatar && !isOwnMessage && (
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarImage src={msg.profiles?.avatar || ''} alt={msg.profiles?.name || ''} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {(msg.profiles?.name || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`${showAvatar && !isOwnMessage ? '' : 'ml-10'} ${isOwnMessage ? 'mr-0' : ''} min-w-0 flex-1`}>
                        {showAvatar && (
                          <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs font-medium text-gray-600">
                              {isOwnMessage ? 'You' : (msg.profiles?.name || 'Unknown User')}
                            </span>
                            {msg.profiles && user && msg.user_id !== user.id && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.profiles?.name?.includes('admin') || msg.profiles?.name?.includes('teacher') ? 'Teacher' : 'Student'}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatTime(new Date(msg.created_at))}
                            </span>
                            {user?.role === 'admin' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-4 w-4 p-0 text-red-500"
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                        
                        <div className={`rounded-lg px-3 py-2 break-words ${
                          isOwnMessage
                            ? 'bg-purple-600 text-white'
                            : (msg.profiles?.name?.includes('admin') || msg.profiles?.name?.includes('teacher'))
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="border-t p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 flex-shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
                disabled={!user}
              />
              <Button size="sm" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || !user}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send, Shift + Enter for new line</span>
            <span>{messages.length} total messages • Real-time enabled</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;
