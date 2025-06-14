import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  BookMarked,
  Users,
  LogOut,
  User,
  Info,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoWrapper } from "./LogoWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MainNav() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate("/login");
    } else {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const userInitials = user?.user_metadata?.full_name
    ? getInitials(user.user_metadata.full_name)
    : user?.email
    ? user.email[0].toUpperCase()
    : "U";

  const teacherTitle = user?.user_metadata?.title || "";

  // Check if we're on a main landing page (home, about, features)
  const isLandingPage = ["/", "/about", "/features"].includes(
    location.pathname
  );

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center mr-6">
          <LogoWrapper />
        </Link>

        {/* Navigation Links - Show full navigation on landing pages */}
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Home
          </Link>

          {/* Always show Features and About on the marketing pages */}
          {isLandingPage && (
            <>
              <Link
                to="/features"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/features"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Features
              </Link>
              <Link
                to="/about"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/about"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                About
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/dashboard"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/planner"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname.includes("/planner")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Lesson Planner
              </Link>
            </>
          )}
          <Link
            to="/join"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/join"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Join Session
          </Link>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {teacherTitle} {user.user_metadata?.full_name || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="w-full cursor-pointer">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/planner" className="w-full cursor-pointer">
                    <BookMarked className="mr-2 h-4 w-4" />
                    <span>Lesson Planner</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
