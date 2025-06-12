
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { 
  Menu, 
  Home, 
  Book, 
  GraduationCap, 
  Settings, 
  LogOut,
  Calendar, 
  FileText, 
  Megaphone,
  MessageCircle,
  FolderOpen 
} from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast({
        title: "Logged out successfully!",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        variant: "destructive",
        title: "Logout failed!",
        description: "There was an error logging you out. Please try again.",
      })
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const adminMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Classes', href: '/classes', icon: Book },
    { name: 'Assignments', href: '/assignments', icon: GraduationCap },
    { name: 'Materials', href: '/materials', icon: FolderOpen },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
  ];

  const studentMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Classes', href: '/classes', icon: Book },
    { name: 'Assignments', href: '/assignments', icon: GraduationCap },
    { name: 'Materials', href: '/materials', icon: FolderOpen },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
  ];

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-semibold text-gray-900">
          Virtual Classroom
        </Link>

        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden" onClick={toggleMenu}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:w-64">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Navigate through Virtual Classroom
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              {(user?.role === 'admin' ? adminMenuItems : studentMenuItems).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors block"
                  onClick={closeMenu}
                >
                  <item.icon className="h-4 w-4 text-gray-600" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
            <SheetHeader>
              <SheetTitle>Account</SheetTitle>
              <SheetDescription>
                Manage your account settings and preferences
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-6">
          {(user?.role === 'admin' ? adminMenuItems : studentMenuItems).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-gray-700 hover:text-gray-900 transition-colors flex items-center space-x-2"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-4 h-8 w-8 p-0 aspect-square">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || "Avatar"} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/profile" className="block">
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/settings" className="block">
                Settings
              </Link>
            </DropdownMenuItem>
            {user?.role === 'admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link to="/users" className="block">
                    Manage Users
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navigation;
