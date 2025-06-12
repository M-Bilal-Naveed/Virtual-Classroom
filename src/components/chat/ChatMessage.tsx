
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ChatMessageWithProfile } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessageProps {
  message: ChatMessageWithProfile;
  showAvatar: boolean;
  onDelete: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  showAvatar,
  onDelete
}) => {
  const { user } = useAuth();
  
  const isOwnMessage = user?.id === message.user_id;
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserRole = () => {
    return message.profiles?.role || 'student';
  };

  const getUserName = () => {
    // If it's the current user's message, show "You"
    if (isOwnMessage) return 'You';
    
    // Show the actual profile name if available
    if (message.profiles?.name) return message.profiles.name;
    
    // Fallback to showing role
    const role = getUserRole();
    return role === 'admin' ? 'Teacher' : 'Student';
  };

  const getMessageBgClass = () => {
    if (isOwnMessage) {
      return 'bg-blue-500 text-white ml-auto';
    }
    
    const userRole = getUserRole();
    if (userRole === 'admin' || userRole === 'teacher') {
      return 'bg-green-100 text-green-900 border border-green-200 mr-auto';
    }
    
    return 'bg-gray-100 text-gray-900 mr-auto';
  };

  const getContainerAlignment = () => {
    return isOwnMessage ? 'justify-end' : 'justify-start';
  };

  const canDeleteMessage = () => {
    return isOwnMessage || user?.role === 'admin';
  };

  return (
    <div className={`flex ${getContainerAlignment()} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {showAvatar && !isOwnMessage && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage 
              src={message.profiles?.avatar || ''} 
              alt={message.profiles?.name || 'User'} 
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {(message.profiles?.name || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`min-w-0 flex-1 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
          {showAvatar && (
            <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <span className="text-xs font-medium text-gray-600">
                {getUserName()}
              </span>
              
              {!isOwnMessage && (
                <Badge variant="secondary" className="text-xs">
                  {getUserRole() === 'admin' ? 'Teacher' : 'Student'}
                </Badge>
              )}
              
              <span className="text-xs text-gray-400">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}
          
          <div className={`rounded-lg px-3 py-2 break-words ${getMessageBgClass()} relative group`}>
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            
            {isOwnMessage && (
              <div className="text-xs text-blue-100 mt-1 text-right">
                {formatTime(message.created_at)}
              </div>
            )}
            
            {canDeleteMessage() && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="absolute -top-2 -right-2 h-6 w-6 p-0 text-red-500 hover:text-red-700 bg-white border border-red-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete(message.id)}
                title="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
