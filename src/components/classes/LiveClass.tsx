
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Users, 
  MessageCircle, 
  Send,
  Monitor,
  Settings,
  Hand,
  FileText
} from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
}

interface Participant {
  id: string;
  name: string;
  isAdmin: boolean;
  video: boolean;
  audio: boolean;
  handRaised: boolean;
}

const LiveClass = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const [participants] = useState<Participant[]>([
    { id: '1', name: 'Dr. Smith', isAdmin: true, video: true, audio: true, handRaised: false },
    { id: '2', name: 'Alice Johnson', isAdmin: false, video: true, audio: false, handRaised: false },
    { id: '3', name: 'Bob Wilson', isAdmin: false, video: false, audio: true, handRaised: true },
    { id: '4', name: 'Carol Davis', isAdmin: false, video: true, audio: true, handRaised: false },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Dr. Smith',
      message: 'Welcome to today\'s Mathematics class!',
      timestamp: new Date(Date.now() - 300000),
      isAdmin: true
    },
    {
      id: '2',
      user: 'Alice Johnson',
      message: 'Thank you, excited to learn today!',
      timestamp: new Date(Date.now() - 240000),
      isAdmin: false
    },
    {
      id: '3',
      user: 'Dr. Smith',
      message: 'Today we\'ll be covering derivatives. Please make sure you have your notebooks ready.',
      timestamp: new Date(Date.now() - 180000),
      isAdmin: true
    }
  ]);

  useEffect(() => {
    // Auto-mark attendance when joining
    if (!attendanceMarked) {
      setTimeout(() => {
        setAttendanceMarked(true);
      }, 2000);
    }
  }, [attendanceMarked]);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user: user?.name || 'Anonymous',
        message: chatMessage,
        timestamp: new Date(),
        isAdmin: user?.role === 'admin'
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  const handleLeaveClass = () => {
    navigate('/dashboard');
  };

  const openGoogleMeet = () => {
    // Simulate opening Google Meet in a new window
    const meetLink = `https://meet.google.com/classroom-${classId}`;
    window.open(meetLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Mathematics - Calculus</h1>
            <Badge variant="secondary" className="bg-green-600 text-white">
              Live
            </Badge>
            {attendanceMarked && (
              <Badge variant="secondary" className="bg-blue-600 text-white">
                Attendance Marked ✓
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>{participants.length} participants</span>
            </div>
            <Button variant="outline" size="sm" onClick={openGoogleMeet}>
              <Video className="h-4 w-4 mr-2" />
              Open in Google Meet
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLeaveClass}>
              <Phone className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Simulated Video Feed */}
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-48 h-48 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-6xl font-bold text-white">DS</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Dr. Smith</h3>
              <p className="text-gray-400">Instructor • Screen Sharing</p>
            </div>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-gray-800/90 backdrop-blur-sm rounded-lg px-6 py-3">
              <Button
                size="sm"
                variant={isAudioOn ? "default" : "destructive"}
                onClick={() => setIsAudioOn(!isAudioOn)}
              >
                {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant={isVideoOn ? "default" : "destructive"}
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant={isScreenSharing ? "secondary" : "outline"}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={handRaised ? "secondary" : "outline"}
                onClick={() => setHandRaised(!handRaised)}
              >
                <Hand className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Participants Grid */}
          <div className="absolute top-4 right-4 w-64">
            <div className="grid grid-cols-2 gap-2">
              {participants.slice(0, 4).map((participant) => (
                <div key={participant.id} className="relative">
                  <div className="w-full h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-1">
                        <span className="text-xs font-bold text-white">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 truncate">{participant.name}</p>
                    </div>
                  </div>
                  {participant.handRaised && (
                    <div className="absolute top-1 right-1">
                      <Hand className="h-4 w-4 text-yellow-400" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex space-x-1">
                    {!participant.audio && (
                      <MicOff className="h-3 w-3 text-red-400" />
                    )}
                    {!participant.video && (
                      <VideoOff className="h-3 w-3 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setShowChat(false)}>
                  ×
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${
                        message.isAdmin ? 'text-purple-400' : 'text-blue-400'
                      }`}>
                        {message.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{message.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button size="sm" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Show Chat Button when hidden */}
      {!showChat && (
        <Button
          className="fixed right-4 top-1/2 transform -translate-y-1/2"
          onClick={() => setShowChat(true)}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default LiveClass;
