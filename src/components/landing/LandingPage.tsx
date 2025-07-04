import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText,
  CheckCircle,
  Code,
  Rocket,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Live Classes",
      description: "Join interactive virtual classrooms with video conferencing."
    },
    {
      icon: FileText,
      title: "Assignments",
      description: "Submit and manage your coursework easily."
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Connect with classmates and teachers instantly."
    },
    {
      icon: Calendar,
      title: "Schedule",
      description: "Never miss a class with our smart calendar system."
    }
  ];

  const stats = [
    { label: "Students", value: "500+", icon: Users },
    { label: "Classes", value: "1,200+", icon: GraduationCap },
    { label: "Materials", value: "800+", icon: BookOpen },
    { label: "Uptime", value: "99.9%", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-primary/5">
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-primary">
            Welcome to the Virtual Classroom
          </h1>
          
          <Button 
            size="lg" 
            onClick={() => navigate('/login')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Start Learning Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;