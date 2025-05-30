
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

const Login = () => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ email: '', password: '', name: '', role: 'student' as 'admin' | 'student' });
  const [activeTab, setActiveTab] = useState('login');
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});
  const [signupErrors, setSignupErrors] = useState<FormErrors>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const { login, signup, loading } = useAuth();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateLoginForm = () => {
    const errors: FormErrors = {};
    
    if (!loginForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(loginForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!loginForm.password.trim()) {
      errors.password = 'Password is required';
    } else if (loginForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignupForm = () => {
    const errors: FormErrors = {};
    
    if (!signupForm.name.trim()) {
      errors.name = 'Full name is required';
    } else if (signupForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!signupForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(signupForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!signupForm.password.trim()) {
      errors.password = 'Password is required';
    } else if (signupForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }

    setLoginLoading(true);
    try {
      console.log('Login form submission:', loginForm.email);
      await login(loginForm.email, loginForm.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in to Virtual Classroom.",
      });
    } catch (error: any) {
      console.error('Login error in component:', error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      
      if (error.message.includes('Invalid login credentials')) {
        setLoginErrors({ email: 'Invalid email or password' });
      } else if (error.message.includes('invalid-email')) {
        setLoginErrors({ email: 'Invalid email format' });
      } else {
        setLoginErrors({ password: 'Login failed. Please try again.' });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignupForm()) {
      return;
    }

    setSignupLoading(true);
    try {
      console.log('Signup form submission:', signupForm.email, signupForm.name, signupForm.role);
      await signup(signupForm.email, signupForm.password, signupForm.name, signupForm.role);
      toast({
        title: "Account created successfully!",
        description: "Welcome to Virtual Classroom! You can now access all features.",
      });
      // Clear form after successful signup
      setSignupForm({ email: '', password: '', name: '', role: 'student' });
    } catch (error: any) {
      console.error('Signup error in component:', error);
      toast({
        title: "Signup failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      });
      
      if (error.message.includes('User already registered')) {
        setSignupErrors({ email: 'This email is already registered' });
      } else if (error.message.includes('weak-password')) {
        setSignupErrors({ password: 'Password is too weak' });
      } else if (error.message.includes('invalid-email')) {
        setSignupErrors({ email: 'Invalid email format' });
      } else {
        setSignupErrors({ email: 'Signup failed. Please try again.' });
      }
    } finally {
      setSignupLoading(false);
    }
  };

  const clearLoginErrors = (field: string) => {
    setLoginErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const clearSignupErrors = (field: string) => {
    setSignupErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 p-4">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Virtual Classroom</h1>
          <p className="text-white/80">Connect, Learn, and Grow Together</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Welcome</CardTitle>
            <CardDescription className="text-white/80">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="login" className="text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={loginForm.email}
                      onChange={(e) => {
                        setLoginForm({ ...loginForm, email: e.target.value });
                        clearLoginErrors('email');
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 ${
                        loginErrors.email ? 'border-red-500' : ''
                      }`}
                      disabled={loginLoading || loading}
                    />
                    {loginErrors.email && (
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {loginErrors.email}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => {
                        setLoginForm({ ...loginForm, password: e.target.value });
                        clearLoginErrors('password');
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 ${
                        loginErrors.password ? 'border-red-500' : ''
                      }`}
                      disabled={loginLoading || loading}
                    />
                    {loginErrors.password && (
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {loginErrors.password}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    disabled={loginLoading || loading}
                  >
                    {loginLoading || loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={signupForm.name}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, name: e.target.value });
                        clearSignupErrors('name');
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 ${
                        signupErrors.name ? 'border-red-500' : ''
                      }`}
                      disabled={signupLoading || loading}
                    />
                    {signupErrors.name && (
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {signupErrors.name}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={signupForm.email}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, email: e.target.value });
                        clearSignupErrors('email');
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 ${
                        signupErrors.email ? 'border-red-500' : ''
                      }`}
                      disabled={signupLoading || loading}
                    />
                    {signupErrors.email && (
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {signupErrors.email}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password (minimum 6 characters)"
                      value={signupForm.password}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, password: e.target.value });
                        clearSignupErrors('password');
                      }}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 ${
                        signupErrors.password ? 'border-red-500' : ''
                      }`}
                      disabled={signupLoading || loading}
                    />
                    {signupErrors.password && (
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {signupErrors.password}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Select 
                      value={signupForm.role} 
                      onValueChange={(value: 'admin' | 'student') => setSignupForm({ ...signupForm, role: value })}
                      disabled={signupLoading || loading}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Student
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Admin/Teacher
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    disabled={signupLoading || loading}
                  >
                    {signupLoading || loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="mt-6 backdrop-blur-sm bg-white/10 border-white/20">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-2">🚀 System Guide</h3>
            <div className="text-white/80 text-sm space-y-2">
              <div>
                <strong className="text-yellow-300">Admin/Teacher:</strong> Schedule classes, upload materials, create assignments, view attendance
              </div>
              <div>
                <strong className="text-green-300">Student:</strong> Join classes, submit assignments, download materials, participate in chat
              </div>
              <div className="mt-3 p-2 bg-white/5 rounded">
                <strong className="text-blue-300">Getting Started:</strong> Create an account to begin using the Virtual Classroom
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
