
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChat } from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { 
  MessageCircle, 
  Search,
  MoreVertical,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

/**
 * Main Chat Component
 */
const Chat = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    searchTerm,
    setSearchTerm,
    sendMessage,
    deleteMessage,
    clearChat,
    refreshMessages,
    isConnected,
    messageCount,
    canDelete,
    canClear
  } = useChat();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                <Badge variant="outline">{messageCount} messages</Badge>
                <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      <span>Live</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      <span>Offline</span>
                    </>
                  )}
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time chat for Virtual Classroom
                {!isConnected && " (Connection lost - trying to reconnect...)"}
              </CardDescription>
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
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={refreshMessages}
                title="Refresh messages"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {canClear && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearChat}
                  title="Clear all messages"
                >
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
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const previousMessage = index > 0 ? messages[index - 1] : null;
                  const showAvatar = !previousMessage || previousMessage.user_id !== msg.user_id;
                  
                  return (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      isOwnMessage={false} // Will be handled in ChatMessage component
                      showAvatar={showAvatar}
                      currentUserRole={canDelete ? 'admin' : 'student'}
                      onDelete={deleteMessage}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <ChatInput
          onSendMessage={sendMessage}
          disabled={!isConnected}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
        />
      </Card>
    </div>
  );
};

export default Chat;
