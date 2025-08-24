"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  Settings,
  UserIcon,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { getAvatarUrl } from "@/lib/utils/getAvatarUrl";
import { NavigationItem, baseNavigationItems } from "@/lib/utils/navElements";
import { IUser, IUserProfile } from "@/types";
import { SystemRole, UserRole } from "@/types/base.types";
import { useAuth } from "@/hooks/auth/useAuth";
import { useProfile } from "@/hooks/auth/useProfile";

// Logo Component with enhanced styling
const ErrandMateLogo: React.FC = () => (
  <div className="flex items-center flex-shrink-0 min-w-0">
    <Link href="/" className="group">
      <div className="flex items-center space-x-2 sm:space-x-3 transition-all duration-300 group-hover:scale-105">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/50 to-blue-600/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full ring-2 ring-white/50 dark:ring-gray-800/50 shadow-lg overflow-hidden bg-gradient-to-br from-red-400 to-blue-600">
            <Image
              src="/errand-logo.jpg"
              alt="Errand Mate"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-blue-600 text-transparent bg-clip-text tracking-tight truncate">
            Errand Mate
          </span>
          <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide truncate">
            Let us run it for you
          </span>
        </div>
      </div>
    </Link>
  </div>
);

// Enhanced NavLink Component
const NavLink: React.FC<{
  href: string;
  children: React.ReactNode;
  isActive: boolean;
  icon?: React.ReactNode;
  className?: string;
}> = ({ href, children, isActive, icon, className }) => (
  <Link
    href={href}
    className={cn(
      "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 group rounded-xl whitespace-nowrap",
      isActive
        ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/50"
        : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/20",
      className
    )}
  >
    {icon && (
      <span className="transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
        {icon}
      </span>
    )}
    <span>{children}</span>
    <div
      className={cn(
        "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-red-500 to-blue-600 transition-all duration-300 rounded-full",
        isActive
          ? "w-1/2 opacity-100"
          : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-100"
      )}
    />
  </Link>
);

// Enhanced Desktop Navigation Dropdown
const NavDropdown: React.FC<{
  item: NavigationItem;
  isActive: boolean;
}> = ({ item, isActive }) => (
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger
          className={cn(
            "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 group rounded-xl whitespace-nowrap bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
            isActive
              ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-800/50"
              : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/20"
          )}
        >
          {item.icon && (
            <span className="transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
              {item.icon}
            </span>
          )}
          <span>{item.title}</span>
          <div
            className={cn(
              "absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-red-500 to-blue-600 transition-all duration-300 rounded-full",
              isActive
                ? "w-1/2 opacity-100"
                : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-100"
            )}
          />
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="w-64 p-2">
            <div className="grid gap-2 sm:gap-3">
              {item.children?.map((child) => (
                <NavigationMenuLink key={child.title} asChild>
                  <Link
                    href={child.href}
                    className="flex items-start p-2 rounded-xl text-sm hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-300 group border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <span className="flex items-center justify-start gap-2 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate">
                          {child.icon && (
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300 flex-shrink-0">
                              {child.icon}
                            </div>
                          )}
                          {child.title}
                        </span>
                        {child.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-gradient-to-r from-red-500/10 to-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-200/30 dark:border-blue-800/30"
                          >
                            {child.badge}
                          </Badge>
                        )}
                      </div>
                      {child.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {child.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </NavigationMenuLink>
              ))}
            </div>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

// Profile completion indicator
const ProfileCompletionIndicator: React.FC<{
  completeness: number;
  className?: string;
}> = ({ completeness, className }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="w-8 h-8 relative">
      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-gray-200 dark:text-gray-700"
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className={cn(
            "transition-all duration-300",
            completeness >= 80
              ? "text-green-500"
              : completeness >= 60
              ? "text-yellow-500"
              : "text-red-500"
          )}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${completeness}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium">{completeness}%</span>
      </div>
    </div>
  </div>
);

// Enhanced Mobile Menu Component
const MobileMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user: IUser | null;
  profile: IUserProfile;
  completeness: number;
  navigationItems: NavigationItem[];
  onLogout: () => void;
}> = ({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  profile,
  completeness,
  navigationItems,
  onLogout,
}) => {
  // Get proper role display
  const getUserRoleDisplay = (): string => {
    if (profile?.role) {
      switch (profile.role) {
        case UserRole.CUSTOMER:
          return "Customer";
        case UserRole.PROVIDER:
          return "Service Provider";
        default:
          return "User";
      }
    }

    if (user?.systemRole) {
      switch (user.systemRole) {
        case SystemRole.SUPER_ADMIN:
          return "Super Admin";
        case SystemRole.ADMIN:
          return "Admin";
        case SystemRole.USER:
        default:
          return "User";
      }
    }

    return "User";
  };

  const userRoleDisplay = getUserRoleDisplay();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-background/95 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-800/50 shadow-2xl z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Enhanced Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
                <ErrandMateLogo />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isAuthenticated && (user || profile) && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200/30 dark:border-blue-800/30">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-blue-200/50 dark:ring-blue-800/50">
                          <AvatarImage src={getAvatarUrl(user?.avatar)} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {profile && (
                          <div className="absolute -bottom-1 -right-1">
                            <ProfileCompletionIndicator
                              completeness={completeness}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-gray-900 dark:text-gray-100">
                          {user?.name || "Unknown User"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {user?.email || "No email"}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {userRoleDisplay}
                        </p>
                      </div>
                    </div>

                    {profile && completeness < 100 && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-1 rounded-md">
                        Complete your profile ({completeness}% done)
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Links */}
                <nav className="space-y-2 mb-6">
                  {navigationItems.map((link) => (
                    <div key={link.title}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors group border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                      >
                        {link.icon && (
                          <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
                            {link.icon}
                          </span>
                        )}
                        <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {link.title}
                        </span>
                      </Link>
                      {link.children && (
                        <div className="ml-6 mt-2 space-y-1">
                          {link.children.map((child) => (
                            <Link
                              key={child.title}
                              href={child.href}
                              onClick={onClose}
                              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {child.icon && (
                                <span className="text-xs">{child.icon}</span>
                              )}
                              <span>{child.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                {/* Action Buttons */}
                <div className="border-t border-gray-200/50 dark:border-gray-800/50 pt-6">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 rounded-xl"
                        asChild
                      >
                        <Link href="/profile" onClick={onClose}>
                          <UserIcon className="h-4 w-4 mr-3" />
                          Profile
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 rounded-xl"
                        asChild
                      >
                        <Link href="/settings" onClick={onClose}>
                          <Settings className="h-4 w-4 mr-3" />
                          Settings
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-12 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800/50"
                        onClick={() => {
                          onLogout();
                          onClose();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700"
                        asChild
                      >
                        <Link href="/login" onClick={onClose}>
                          Sign In
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl"
                        asChild
                      >
                        <Link href="/signup" onClick={onClose}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Main Header Component
export const MainHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = usePathname();

  // Using both auth and profile hooks
  const {
    user,
    isAuthenticated,
    logout,
    isLoading: authLoading,
    error: authError,
  } = useAuth();

  const {
    profile,
    completeness,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();

  // Determine if we have any errors to show
  const hasError = authError || profileError;
  const isLoading = authLoading || (isAuthenticated && profileLoading);

  // Memoize navigation items
  const navigationItems = useMemo(() => [...baseNavigationItems], []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mobile menu
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Check if a path is active
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path) || false;
  };

  // Get proper role display
  const getUserRoleDisplay = (): string => {
    if (profile?.role) {
      switch (profile.role) {
        case UserRole.CUSTOMER:
          return "Customer";
        case UserRole.PROVIDER:
          return "Service Provider";
        default:
          return "User";
      }
    }

    if (user?.systemRole) {
      switch (user.systemRole) {
        case SystemRole.SUPER_ADMIN:
          return "Super Admin";
        case SystemRole.ADMIN:
          return "Admin";
        case SystemRole.USER:
        default:
          return "User";
      }
    }

    return "User";
  };

  const userRoleDisplay = getUserRoleDisplay();

  // Check admin permissions using proper system role checks
  const isAdmin =
    user?.systemRole === SystemRole.ADMIN ||
    user?.systemRole === SystemRole.SUPER_ADMIN;

  const isSuperAdmin = user?.systemRole === SystemRole.SUPER_ADMIN;

  return (
    <>
      {/* Error Alert */}
      {hasError && (
        <Alert className="mx-4 mt-4 border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError || profileError}</AlertDescription>
        </Alert>
      )}

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300 border-b",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl shadow-sm border-gray-200/50 dark:border-gray-800/50"
            : "bg-background border-gray-200/50 dark:border-gray-800/50"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ErrandMateLogo />
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex xl:items-center xl:space-x-1">
              {navigationItems.map((item) =>
                item.children ? (
                  <NavDropdown
                    key={item.title}
                    item={item}
                    isActive={isActive(item.href)}
                  />
                ) : (
                  <NavLink
                    key={item.title}
                    href={item.href}
                    isActive={isActive(item.href)}
                    icon={item.icon}
                  >
                    {item.title}
                  </NavLink>
                )
              )}
            </nav>

            {/* Enhanced Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-sm mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 rounded-xl border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Search button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => {
                  // Handle mobile search
                }}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Loading indicator */}
              {isLoading && (
                <div className="hidden md:flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              )}

              {isAuthenticated && (user || profile) ? (
                <>
                  {/* Enhanced User Menu */}
                  <UserMenu
                    user={user || {}}
                    profile={profile as IUserProfile}
                    completeness={completeness}
                    userRoleDisplay={userRoleDisplay}
                    isAdmin={isAdmin}
                    isSuperAdmin={isSuperAdmin}
                    onLogout={handleLogout}
                  />
                </>
              ) : (
                /* Enhanced Auth Buttons */
                <div className="hidden md:flex items-center space-x-3">
                  <Button variant="ghost" asChild className="rounded-xl">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-xl bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 shadow-lg"
                  >
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={handleMobileMenuToggle}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </motion.div>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user as IUser}
        profile={profile as IUserProfile}
        completeness={completeness}
        navigationItems={navigationItems}
        onLogout={handleLogout}
      />
    </>
  );
};

export default MainHeader;
