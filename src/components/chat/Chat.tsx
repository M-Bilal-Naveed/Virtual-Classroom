
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Smile,
  Paperclip,
  Search,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
  type: 'text' | 'file' | 'system';
  edited?: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  role: 'admin' | 'student';
  lastSeen?: Date;
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [onlineUsers] = useState<ChatUser[]>([
    {
      id: '1',
      name: 'Dr. Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=drsmith',
      isOnline: true,
      role: 'admin'
    },
    {
      id: '2',
      name: 'Alice Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      isOnline: true,
      role: 'student'
    },
    {
      id: '3',
      name: 'Bob Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      isOnline: false,
      role: 'student',
      lastSeen: new Date(Date.now() - 300000)
    },
    {
      id: '4',
      name: 'Carol Davis',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
      isOnline: true,
      role: 'student'
    }
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: '1',
      userName: 'Dr. Smith',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=drsmith',
      message: 'Welcome everyone! This is our class discussion room. Feel free to ask questions and help each other.',
      timestamp: new Date(Date.now() - 3600000),
      isAdmin: true,
      type: 'text'
    },
    {
      id: '2',
      userId: '2',
      userName: 'Alice Johnson',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      message: 'Thank you Dr. Smith! I have a question about the assignment due next week.',
      timestamp: new Date(Date.now() - 3300000),
      isAdmin: false,
      type: 'text'
    },
    {
      id: '3',
      userId: '1',
      userName: 'Dr. Smith',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=drsmith',
      message: 'Of course Alice! What specific part would you like help with?',
      timestamp: new Date(Date.now() - 3000000),
      isAdmin: true,
      type: 'text'
    },
    {
      id: '4',
      userId: '4',
      userName: 'Carol Davis',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
      message: 'I have the same question! Specifically about problem 3 in the calculus set.',
      timestamp: new Date(Date.now() - 2700000),
      isAdmin: false,
      type: 'text'
    },
    {
      id: '5',
      userId: '1',
      userName: 'Dr. Smith',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=drsmith',
      message: 'Great question! For problem 3, remember to apply the chain rule when dealing with composite functions. I\'ll share a detailed explanation in our next class.',
      timestamp: new Date(Date.now() - 2400000),
      isAdmin: true,
      type: 'text'
    },
    {
      id: '6',
      userId: '2',
      userName: 'Alice Johnson',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      message: 'That makes so much sense now! Thank you for the clarification.',
      timestamp: new Date(Date.now() - 1800000),
      isAdmin: false,
      type: 'text'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user?.id || '',
      userName: user?.name || '',
      userAvatar: user?.avatar || '',
      message: message.trim(),
      timestamp: new Date(),
      isAdmin: user?.role === 'admin',
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    toast({
      title: "Message sent!",
      description: "Your message has been sent to the chat.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredMessages = messages.filter(msg =>
    msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex h-[calc(100vh-200px)] gap-6">
        
        {/* Online Users Sidebar */}
        <div className="w-80 flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Online Users</span>
                <Badge variant="secondary">
                  {onlineUsers.filter(u => u.isOnline).length}
                </Badge>
              </CardTitle>
              <CardDescription>Students and teachers in the classroom</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {onlineUsers.map((chatUser) => (
                  <div key={chatUser.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={chatUser.avatar} alt={chatUser.name} />
                        <AvatarFallback className="bg-purple-100 text-purple-700">
                          {chatUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        chatUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chatUser.name}
                        </p>
                        {chatUser.role === 'admin' && (
                          <Badge variant="secondary" className="text-xs">
                            Teacher
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {chatUser.isOnline ? 'Online' : `Last seen ${formatLastSeen(chatUser.lastSeen!)}`}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Video className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span>Class Discussion</span>
                  </CardTitle>
                  <CardDescription>General chat for Mathematics - Calculus</CardDescription>
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
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {filteredMessages.map((msg, index) => {
                    const isOwnMessage = msg.userId === user?.id;
                    const showAvatar = index === 0 || filteredMessages[index - 1].userId !== msg.userId;
                    
                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
                          {showAvatar && !isOwnMessage && (
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {msg.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`${showAvatar && !isOwnMessage ? '' : 'ml-10'} ${isOwnMessage ? 'mr-0' : ''}`}>
                            {showAvatar && (
                              <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs font-medium text-gray-600">
                                  {isOwnMessage ? 'You' : msg.userName}
                                </span>
                                {msg.isAdmin && (
                                  <Badge variant="secondary" className="text-xs">
                                    Teacher
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-400">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                            )}
                            
                            <div className={`rounded-lg px-3 py-2 ${
                              isOwnMessage
                                ? 'bg-purple-600 text-white'
                                : msg.isAdmin
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

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-10"
                  />
                  <Button size="sm" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Press Enter to send, Shift + Enter for new line</span>
                <span>{onlineUsers.filter(u => u.isOnline).length} users online</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
