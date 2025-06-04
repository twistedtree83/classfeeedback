import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogoWrapper } from './LogoWrapper';
import { Navbar1 } from './ui/shadcnblocks-com-navbar1';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate('/login');
    } else {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Build menu items for Navbar1
  const menuItems = [
    { title: "Home", url: "/" },
  ];

  if (user) {
    menuItems.push(
      { title: "Dashboard", url: "/dashboard" },
      { title: "Lesson Planner", url: "/planner" }
    );
  }
  
  menuItems.push({ title: "Join Session", url: "/join" });

  // Auth options
  const authOptions = {
    login: { 
      text: "Sign in", 
      url: "/login" 
    },
    signup: { 
      text: "Sign up", 
      url: "/signup" 
    }
  };

  // Custom logo
  const logo = {
    url: "/",
    src: "/images/logo.png", 
    alt: "CoTeach",
    title: ""
  };
  
  // If user is signed in, override auth options with profile dropdown
  const userInitials = user?.user_metadata?.full_name 
    ? getInitials(user.user_metadata.full_name) 
    : user?.email ? user.email[0].toUpperCase() : 'U';

  return (
    <Navbar1
      logo={logo}
      menu={menuItems}
      auth={user ? {
        login: { text: userInitials, url: "/profile" },
        signup: { text: "Sign out", url: "#" }
      } : authOptions}
      mobileExtraLinks={[
        { name: "Profile", url: "/profile" },
        { name: "Settings", url: "/profile" },
      ]}
    />
  );
}