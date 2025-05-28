
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { persistentStorage } from '../../utils/persistentStorage';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageCircle,
  Users,
  Hand,
  Share,
  PhoneOff,
  ExternalLink,
  Clock
} from 'lucide-react';

const LiveClass = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    // Load class information
    const data = persistentStorage.getData();
    const foundClass = data.scheduledClasses.find(cls => cls.id === classId);
    
    if (foundClass) {
      setClassInfo(foundClass);
      
      // Automatically mark attendance when joining class
      if (user) {
        attendanceService.markAttendance(
          user.id,
          user.name,
          foundClass.id,
          foundClass.title
        );
        
        toast({
          title: "Joined class successfully",
          description: "Your attendance has been automatically recorded.",
        });
      }
      
      // Simulate participants
      setParticipants([
        {
          id: user?.id,
          name: user?.name,
          role: user?.role,
          isVideoOn: false,
          isAudioOn: false,
          isHandRaised: false
        }
      ]);
    }

    // Load chat messages
    setChatMessages(data.chatMessages || []);
  }, [classId, user]);

  const sendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        userId: user?.id,
        userName: user?.name,
        userAvatar: user?.avatar,
        message: chatMessage,
        timestamp: new Date(),
        isAdmin: user?.role === 'admin',
        type: 'text'
      };
      
      const data = persistentStorage.getData();
      const updatedMessages = [...data.chatMessages, newMessage];
      persistentStorage.updateChatMessages(updatedMessages);
      setChatMessages(updatedMessages);
      setChatMessage('');
    }
  };

  const openInGoogleMeet = () => {
    if (classInfo?.meetLink) {
      window.open(classInfo.meetLink, '_blank');
    }
  };

  if (!classInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Class not found</h2>
            <p className="text-gray-600">The requested class could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Class Header */}
      <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{classInfo.title}</CardTitle>
              <p className="text-blue-100 mt-2">{classInfo.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{classInfo.time}</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Live
                </Badge>
              </div>
            </div>
            <Button 
              onClick={openInGoogleMeet}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Google Meet
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-3">
          <Card className="h-96">
            <CardContent className="p-0 h-full bg-gray-900 rounded-lg overflow-hidden relative">
              {/* Video Placeholder */}
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center text-white">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Class Video Stream</h3>
                  <p className="text-gray-400">Click "Open in Google Meet" for actual video conferencing</p>
                </div>
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
                  <Button
                    size="sm"
                    variant={isVideoOn ? "default" : "secondary"}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className="rounded-full"
                  >
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={isAudioOn ? "default" : "secondary"}
                    onClick={() => setIsAudioOn(!isAudioOn)}
                    className="rounded-full"
                  >
                    {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant={isHandRaised ? "default" : "secondary"}
                    onClick={() => setIsHandRaised(!isHandRaised)}
                    className="rounded-full"
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
                  
                  {user?.role === 'admin' && (
                    <Button size="sm" variant="secondary" className="rounded-full">
                      <Share className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button size="sm" variant="destructive" className="rounded-full">
                    <PhoneOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Participants ({participants.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {participant.name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{participant.name}</p>
                      <p className="text-xs text-gray-500">{participant.role}</p>
                    </div>
                    {participant.isHandRaised && (
                      <Hand className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="h-80">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-60">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {chatMessages.slice(-10).map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-medium ${msg.isAdmin ? 'text-purple-600' : 'text-gray-700'}`}>
                        {msg.userName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-800">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={sendMessage}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveClass;
