
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Smile, Paperclip } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  onTypingChange?: (isTyping: boolean) => void;
}

/**
 * ChatInput Component
 * 
 * Handles message input and sending with:
 * - Text input with keyboard shortcuts
 * - Send button with loading state
 * - Typing indicators
 * - File attachment placeholder
 * - Emoji picker placeholder
 * 
 * Features:
 * - Enter to send, Shift+Enter for new line
 * - Auto-focus after sending message
 * - Typing status tracking
 * - Input validation
 * - Responsive design
 * 
 * File: src/components/chat/ChatInput.tsx
 */
const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  onTypingChange
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handles sending the message
   */
  const handleSendMessage = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
      
      // Clear typing status
      if (onTypingChange) {
        onTypingChange(false);
      }
      
      // Focus back on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Handles keyboard events for message input
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handles input changes and typing indicators
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Handle typing indicators
    if (onTypingChange) {
      // User is typing
      onTypingChange(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 1000); // Stop typing indicator after 1 second of inactivity
    }
  };

  /**
   * Cleanup typing timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle file attachment (placeholder functionality)
   */
  const handleFileAttachment = () => {
    // TODO: Implement file attachment functionality
    console.log('File attachment clicked');
  };

  /**
   * Handle emoji picker (placeholder functionality)
   */
  const handleEmojiPicker = () => {
    // TODO: Implement emoji picker functionality
    console.log('Emoji picker clicked');
  };

  return (
    <div className="border-t p-4 flex-shrink-0 bg-white">
      {/* Main Input Row */}
      <div className="flex items-center space-x-2">
        {/* File Attachment Button */}
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-10 w-10 p-0 flex-shrink-0"
          onClick={handleFileAttachment}
          disabled={disabled}
          title="Attach file (coming soon)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        {/* Message Input */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="pr-10"
            disabled={disabled || isSending}
            maxLength={1000}
          />
          
          {/* Emoji Button */}
          <Button 
            size="sm" 
            variant="ghost" 
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleEmojiPicker}
            disabled={disabled}
            title="Add emoji (coming soon)"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Send Button */}
        <Button 
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled || isSending}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 flex-shrink-0"
          title="Send message"
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Input Help Text */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>Press Enter to send, Shift + Enter for new line</span>
        <span>{message.length}/1000 characters</span>
      </div>
    </div>
  );
};

export default ChatInput;
