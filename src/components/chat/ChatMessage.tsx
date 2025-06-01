
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
  currentUserRole?: string;
  onDelete: (messageId: string) => void;
}

/**
 * ChatMessage Component
 * 
 * Renders an individual chat message with:
 * - User avatar and name
 * - Message content with appropriate styling
 * - Timestamp
 * - Delete button for admins
 * - Role badges for teachers/admins
 * 
 * Features:
 * - Different styling for own messages vs others
 * - Avatar grouping (only show avatar for first message in sequence)
 * - Role-based styling and badges
 * - Admin delete functionality
 * 
 * File: src/components/chat/ChatMessage.tsx
 */
const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  showAvatar,
  currentUserRole,
  onDelete
}) => {
  const { user } = useAuth();
  
  // Check if this message is from the current user
  const isOwnMessage = user?.id === message.user_id;
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserRole = () => {
    // Check the actual user role from the database or message profile
    const userName = message.profiles?.name || '';
    if (userName.toLowerCase().includes('admin') || userName.toLowerCase().includes('teacher')) {
      return 'Teacher';
    }
    return 'Student';
  };

  const getMessageBgClass = () => {
    if (isOwnMessage) {
      return 'bg-blue-500 text-white ml-auto';
    }
    
    const userRole = getUserRole();
    if (userRole === 'Teacher') {
      return 'bg-green-100 text-green-900 border border-green-200 mr-auto';
    }
    
    return 'bg-gray-100 text-gray-900 mr-auto';
  };

  const getContainerAlignment = () => {
    return isOwnMessage ? 'justify-end' : 'justify-start';
  };

  return (
    <div className={`flex ${getContainerAlignment()} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar - only show for other users' messages and first message in sequence */}
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
        
        {/* Message Content */}
        <div className={`min-w-0 flex-1 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
          {/* Message Header - only show for first message in sequence and other users */}
          {showAvatar && !isOwnMessage && (
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium text-gray-600">
                {message.profiles?.name || 'Unknown User'}
              </span>
              
              {/* Role Badge */}
              <Badge variant="secondary" className="text-xs">
                {getUserRole()}
              </Badge>
              
              <span className="text-xs text-gray-400">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}
          
          {/* Message Bubble */}
          <div className={`rounded-lg px-3 py-2 break-words ${getMessageBgClass()} relative group`}>
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            
            {/* Timestamp for own messages */}
            {isOwnMessage && (
              <div className="text-xs text-blue-100 mt-1 text-right">
                {formatTime(message.created_at)}
              </div>
            )}
            
            {/* Delete Button - only for admins */}
            {currentUserRole === 'admin' && (
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
