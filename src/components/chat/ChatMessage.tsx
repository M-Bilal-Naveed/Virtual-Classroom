
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ChatMessageWithProfile } from '../../services/chatService';

interface ChatMessageProps {
  message: ChatMessageWithProfile;
  isOwnMessage: boolean;
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
  isOwnMessage,
  showAvatar,
  currentUserRole,
  onDelete
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserRole = () => {
    const userName = message.profiles?.name || '';
    if (userName.toLowerCase().includes('admin') || userName.toLowerCase().includes('teacher')) {
      return 'Teacher';
    }
    return 'Student';
  };

  const getMessageBgClass = () => {
    if (isOwnMessage) {
      return 'bg-purple-600 text-white';
    }
    
    const userRole = getUserRole();
    if (userRole === 'Teacher') {
      return 'bg-blue-100 text-blue-900 border border-blue-200';
    }
    
    return 'bg-gray-100 text-gray-900';
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
        {/* Avatar - only show for first message in sequence and not for own messages */}
        {showAvatar && !isOwnMessage && (
          <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
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
        <div className={`${showAvatar && !isOwnMessage ? '' : 'ml-10'} ${isOwnMessage ? 'mr-0' : ''} min-w-0 flex-1`}>
          {/* Message Header - only show for first message in sequence */}
          {showAvatar && (
            <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <span className="text-xs font-medium text-gray-600">
                {isOwnMessage ? 'You' : (message.profiles?.name || 'Unknown User')}
              </span>
              
              {/* Role Badge - only for other users */}
              {!isOwnMessage && (
                <Badge variant="secondary" className="text-xs">
                  {getUserRole()}
                </Badge>
              )}
              
              {/* Timestamp */}
              <span className="text-xs text-gray-400">
                {formatTime(message.created_at)}
              </span>
              
              {/* Delete Button - only for admins */}
              {currentUserRole === 'admin' && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                  onClick={() => onDelete(message.id)}
                  title="Delete message"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          
          {/* Message Bubble */}
          <div className={`rounded-lg px-3 py-2 break-words ${getMessageBgClass()}`}>
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
