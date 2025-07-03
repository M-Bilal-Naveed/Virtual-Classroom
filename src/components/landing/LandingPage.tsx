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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b-2 border-gray-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-900 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 font-mono">
                VirtualClass.dev
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 font-mono"
              >
                login()
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-gray-900 hover:bg-gray-800 text-white font-mono"
              >
                start_coding()
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-gray-900 text-white font-mono">
            <Rocket className="mr-1 h-3 w-3" />
            v1.0.0-beta
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 font-mono">
            virtual-classroom
            <br />
            <span className="text-gray-600">.initialize()</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto font-mono">
            // A clean, minimal learning platform
            <br />
            // Built for developers who value simplicity
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="bg-gray-900 hover:bg-gray-800 text-white font-mono text-base px-8 py-3"
            >
              npm start
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-6 w-6 text-gray-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1 font-mono">{stat.value}</div>
                <div className="text-sm text-gray-600 font-mono">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 font-mono">
              features = {"{"}
            </h2>
            <p className="text-lg text-gray-600 font-mono">
              // Core functionality for modern learning
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border border-gray-200 hover:border-gray-900 transition-colors duration-200 bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded border">
                      <feature.icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <CardTitle className="text-lg text-gray-900 font-mono">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 font-mono text-sm">
                    // {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-900 font-mono text-lg">{"}"}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 font-mono">
            ready_to_deploy?
          </h2>
          <p className="text-lg text-gray-600 mb-8 font-mono">
            // Start building your learning environment today
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/login')}
            className="bg-gray-900 hover:bg-gray-800 text-white font-mono text-base px-8 py-3"
          >
            git clone virtual-classroom
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="p-2 bg-white rounded">
                <Code className="h-4 w-4 text-gray-900" />
              </div>
              <span className="text-lg font-bold font-mono">VirtualClass.dev</span>
            </div>
            <div className="text-sm text-gray-400 font-mono">
              // Made with ❤️ by a fresh developer
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;