"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  Settings,
  LogOut,
  AlertCircle,
  Shield,
  Users,
  BarChart3,
  Database,
  Bell,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/utils/getAvatarUrl";
import { IUser } from "@/types";
import { SystemRole } from "@/types/base.types";
import { useAuth } from "@/hooks/auth/useAuth";

// Minimal Admin Logo
const AdminLogo: React.FC = () => (
  <Link href="/admin" className="flex items-center space-x-2">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center">
      <Shield className="w-4 h-4 text-white" />
    </div>
    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-red-600 text-transparent bg-clip-text">
      Admin
    </span>
  </Link>
);

// Minimal Admin Navigation
const adminNavItems = [
  { title: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
  {
    title: "Dashboard",
    href: "/admin",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  { title: "Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
  {
    title: "Services",
    href: "/admin/services",
    icon: <Database className="h-4 w-4" />,
  },
];

// Simple NavLink
const NavLink: React.FC<{
  href: string;
  children: React.ReactNode;
  isActive: boolean;
  icon?: React.ReactNode;
}> = ({ href, children, isActive, icon }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
      isActive
        ? "text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/30"
        : "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
    )}>
    {icon}
    <span>{children}</span>
  </Link>
);

// Minimal User Menu
const AdminUserMenu: React.FC<{
  user: IUser;
  onLogout: () => void;
}> = ({ user, onLogout }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-10 rounded-full px-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={getAvatarUrl(user?.avatar)} />
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-red-600 text-white text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <p className="font-medium">{user?.name || "Admin"}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {user?.systemRole === SystemRole.SUPER_ADMIN
              ? "Super Admin"
              : "Admin"}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/admin/settings">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout} className="text-red-600">
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function AdminHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const pathname = usePathname();

  const { user, isAuthenticated, isLoading, error: authError } = useAuth();

  // Check admin permissions
  const isAdmin =
    user?.systemRole === SystemRole.ADMIN ||
    user?.systemRole === SystemRole.SUPER_ADMIN;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const router = useRouter();

  const handleLogout = () => {
    // close mobile menu
    setIsMobileMenuOpen(false);
    // redirect to logout page
    router.push("/logout");
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    if (path === "/admin") return pathname === "/admin";
    return pathname?.startsWith(path) || false;
  };

  // Mock notifications - replace with real data
  const notifications = [
    {
      id: 1,
      title: "New user registration",
      message: "John Doe just signed up",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "Service approval needed",
      message: "Home cleaning service pending review",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 3,
      title: "System update",
      message: "Scheduled maintenance completed",
      time: "1 hour ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Redirect non-admin users
  if (!isLoading && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Admin access required.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {authError && (
        <Alert className="mx-4 mt-4 border-red-200 bg-red-50 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "sticky top-0 z-40 mb-2 w-full transition-all duration-300 border-b",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl shadow-sm border-gray-200/50 dark:border-gray-800/50"
            : "bg-background border-gray-200/50 dark:border-gray-800/50"
        )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <AdminLogo />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.title}
                  href={item.href}
                  isActive={isActive(item.href)}
                  icon={item.icon}>
                  {item.title}
                </NavLink>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <DropdownMenu
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                        {unreadCount}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="cursor-pointer p-3 flex-col items-start">
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2 flex-shrink-0"></div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center cursor-pointer">
                    <span className="text-sm text-blue-600">
                      View all notifications
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
              )}

              {isAuthenticated && user && isAdmin && (
                <AdminUserMenu user={user as IUser} onLogout={handleLogout} />
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200/50 dark:border-gray-800/50 py-4">
              <nav className="space-y-2">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive(item.href)
                        ? "text-purple-600 bg-purple-50/80 dark:bg-purple-950/30"
                        : "text-gray-600 hover:text-purple-600 hover:bg-gray-50"
                    )}>
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </div>
      </motion.header>
    </>
  );
}
