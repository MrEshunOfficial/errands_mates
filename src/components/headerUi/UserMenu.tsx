import React from "react";
import {
  Settings,
  UserIcon,
  LogOut,
  Shield,
  MapPin,
  MessageSquare,
  HelpCircle,
  Package,
  Sun,
  Moon,
  Monitor,
  Bell,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { IUser } from "@/types";
import { IUserProfile } from "@/types/profile.types";
import { UserRole, SystemRole, VerificationStatus } from "@/types/base.types";
import { useTheme } from "next-themes";
import { getAvatarUrl } from "@/lib/utils/getAvatarUrl";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Theme Switcher Component
const ThemeSwitcher: React.FC = () => {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {theme === "light" && <Sun className="mr-2 h-4 w-4" />}
        {theme === "dark" && <Moon className="mr-2 h-4 w-4" />}
        {theme === "system" && <Monitor className="mr-2 h-4 w-4" />}
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

// Enhanced Notification Button Component
const NotificationButton: React.FC<{
  notificationCount?: number;
}> = ({ notificationCount = 3 }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-full hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
      asChild>
      <Link href="/notifications">
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}>
            <Badge
              variant="destructive"
              className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg">
              {notificationCount > 99 ? "99+" : notificationCount}
            </Badge>
          </motion.div>
        )}
      </Link>
    </Button>
  );
};

// Profile Completion Indicator
const ProfileCompletionIndicator: React.FC<{
  completeness: number;
  className?: string;
}> = ({ completeness, className }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="w-6 h-6 relative">
      <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-gray-200 dark:text-gray-700"
          stroke="currentColor"
          strokeWidth="3"
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
          strokeWidth="3"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${completeness}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-medium">{completeness}%</span>
      </div>
    </div>
  </div>
);

// Verification Status Badge
const VerificationBadge: React.FC<{
  status: VerificationStatus;
}> = ({ status }) => {
  const getStatusConfig = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.VERIFIED:
        return {
          icon: CheckCircle,
          color:
            "text-green-600 bg-green-100 dark:bg-green-950/30 dark:text-green-400",
          label: "Verified",
        };
      case VerificationStatus.PENDING:
        return {
          icon: AlertCircle,
          color:
            "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-400",
          label: "Pending",
        };
      case VerificationStatus.UNDER_REVIEW:
        return {
          icon: AlertCircle,
          color:
            "text-blue-600 bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400",
          label: "Under Review",
        };
      case VerificationStatus.REJECTED:
        return {
          icon: AlertCircle,
          color: "text-red-600 bg-red-100 dark:bg-red-950/30 dark:text-red-400",
          label: "Rejected",
        };
      case VerificationStatus.SUSPENDED:
        return {
          icon: AlertCircle,
          color: "text-red-600 bg-red-100 dark:bg-red-950/30 dark:text-red-400",
          label: "Suspended",
        };
      default:
        return {
          icon: AlertCircle,
          color:
            "text-gray-600 bg-gray-100 dark:bg-gray-950/30 dark:text-gray-400",
          label: "Unverified",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={cn("text-xs px-2 py-1 gap-1 border-0", config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// Role Display Component
const RoleDisplay: React.FC<{
  role: UserRole | SystemRole | string;
  isSystemRole?: boolean;
}> = ({ role, isSystemRole = false }) => {
  const getRoleConfig = (
    role: UserRole | SystemRole | string,
    isSystemRole: boolean
  ) => {
    if (isSystemRole) {
      switch (role as SystemRole) {
        case SystemRole.SUPER_ADMIN:
          return {
            icon: Shield,
            color:
              "text-red-600 bg-red-100 dark:bg-red-950/30 dark:text-red-400",
            label: "Super Admin",
          };
        case SystemRole.ADMIN:
          return {
            icon: Shield,
            color:
              "text-purple-600 bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400",
            label: "Admin",
          };
        case SystemRole.USER:
        default:
          return {
            icon: UserIcon,
            color:
              "text-gray-600 bg-gray-100 dark:bg-gray-950/30 dark:text-gray-400",
            label: "User",
          };
      }
    } else {
      switch (role as UserRole) {
        case UserRole.PROVIDER:
          return {
            icon: TrendingUp,
            color:
              "text-blue-600 bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400",
            label: "Service Provider",
          };
        case UserRole.CUSTOMER:
          return {
            icon: Users,
            color:
              "text-green-600 bg-green-100 dark:bg-green-950/30 dark:text-green-400",
            label: "Customer",
          };
        default:
          return {
            icon: UserIcon,
            color:
              "text-gray-600 bg-gray-100 dark:bg-gray-950/30 dark:text-gray-400",
            label: "User",
          };
      }
    }
  };

  const config = getRoleConfig(role, isSystemRole);
  const Icon = config.icon;

  return (
    <Badge className={cn("text-xs px-2 py-1 gap-1 border-0", config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// User Menu Props Interface
interface UserMenuProps {
  user?: Partial<IUser>;
  profile?: IUserProfile | null;
  completeness?: number;
  userRoleDisplay?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onLogout: () => void;
  notificationCount?: number;
}

// User Menu Component
export const UserMenu: React.FC<UserMenuProps> = ({
  user = {},
  profile,
  completeness = 0,
  isAdmin = false,
  isSuperAdmin = false,
  onLogout,
  notificationCount = 0,
}) => {
  // Determine display values with smart fallbacks
  const displayName = user?.name || "Unknown User";
  const displayEmail = user?.email || "No email";
  const displayAvatar = user?.avatar || "";
  const verificationStatus = profile?.verificationStatus;
  const isMarketplaceActive = profile?.isActiveInMarketplace || false;

  // Get proper role display with type checking
  const getRoleDisplay = () => {
    // Primary role from profile (UserRole)
    if (profile?.role) {
      return {
        role: profile.role,
        isSystemRole: false,
        display:
          profile.role === UserRole.PROVIDER
            ? "Service Provider"
            : profile.role === UserRole.CUSTOMER
            ? "Customer"
            : "User",
      };
    }

    // Fallback to system role
    if (user?.systemRole) {
      return {
        role: user.systemRole,
        isSystemRole: true,
        display:
          user.systemRole === SystemRole.SUPER_ADMIN
            ? "Super Admin"
            : user.systemRole === SystemRole.ADMIN
            ? "Admin"
            : "User",
      };
    }

    return {
      role: SystemRole.USER,
      isSystemRole: true,
      display: "User",
    };
  };

  const roleInfo = getRoleDisplay();

  return (
    <div className="flex items-center space-x-2">
      {/* Notification Button */}
      <NotificationButton notificationCount={notificationCount} />

      {/* User Menu Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="rounded-full p-0 hover:bg-accent relative"
            size="icon">
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-offset-1 ring-gray-200/50 dark:ring-gray-700/50">
                <AvatarImage
                  src={getAvatarUrl(displayAvatar)}
                  alt={`${displayName} avatar`}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                  {displayName.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Profile completion indicator */}
              {profile && completeness < 100 && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}

              {/* Verification indicator */}
              {profile &&
                verificationStatus === VerificationStatus.VERIFIED && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-72 p-0" align="end" sideOffset={8}>
          {/* Enhanced User Info Header */}
          <DropdownMenuLabel className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-start space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-blue-200/50 dark:ring-blue-800/50">
                  <AvatarImage src={getAvatarUrl(displayAvatar)} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {displayName.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile && (
                  <div className="absolute -bottom-1 -right-1">
                    <ProfileCompletionIndicator completeness={completeness} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none truncate text-gray-900 dark:text-gray-100">
                  {displayName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                  {displayEmail}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <RoleDisplay
                    role={roleInfo.role}
                    isSystemRole={roleInfo.isSystemRole}
                  />
                  {profile && verificationStatus && (
                    <VerificationBadge status={verificationStatus} />
                  )}
                </div>

                {/* Profile completion progress */}
                {profile && completeness < 100 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Profile
                      </span>
                      <span className="font-medium">{completeness}%</span>
                    </div>
                    <Progress value={completeness} className="h-1.5" />
                  </div>
                )}

                {/* Marketplace status */}
                {profile && isMarketplaceActive && (
                  <div className="mt-2">
                    <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-0">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Active in Marketplace
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <div className="p-2">
            {/* Quick Stats (if profile exists) */}
            {profile && (
              <>
                <div className="px-2 py-3 bg-gray-50/50 dark:bg-gray-800/20 rounded-lg mb-2">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {completeness}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Complete
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {verificationStatus === VerificationStatus.VERIFIED
                          ? "✓"
                          : "○"}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Verified
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Main Menu Items */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer">
                  <UserIcon className="mr-3 h-4 w-4" />
                  <span>Profile</span>
                  {profile && completeness < 100 && (
                    <Badge className="ml-auto text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-0">
                      {completeness}%
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="w-full cursor-pointer">
                  <BarChart3 className="mr-3 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/requests" className="w-full cursor-pointer">
                  <Package className="mr-3 h-4 w-4" />
                  <span>My Requests</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/messages" className="w-full cursor-pointer">
                  <MessageSquare className="mr-3 h-4 w-4" />
                  <span>Messages</span>
                  {notificationCount > 0 && (
                    <Badge className="ml-auto h-5 w-5 p-0 text-xs bg-red-500 text-white">
                      {notificationCount}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/location" className="w-full cursor-pointer">
                  <MapPin className="mr-3 h-4 w-4" />
                  <span>Location</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Theme Switcher */}
            <ThemeSwitcher />

            <DropdownMenuSeparator />

            {/* Settings and Support */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer">
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/help" className="w-full cursor-pointer">
                  <HelpCircle className="mr-3 h-4 w-4" />
                  <span>Help & Support</span>
                </Link>
              </DropdownMenuItem>

              {/* Admin Panel - Only for system admins */}
              {(isAdmin || isSuperAdmin) && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin-dashboard"
                    className="w-full cursor-pointer">
                    <Shield className="mr-3 h-4 w-4" />
                    <span>Admin Panel</span>
                    {isSuperAdmin && (
                      <Badge className="ml-auto text-xs bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-0">
                        Super
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={onLogout}>
              <LogOut className="mr-3 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
