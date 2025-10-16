import React from "react";
import {
  Settings,
  UserIcon,
  Shield,
  HelpCircle,
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
import { IUser, IUserProfile } from "@/types";
import { UserRole, SystemRole, VerificationStatus } from "@/types/base.types";
import { useTheme } from "next-themes";
import { getAvatarUrl } from "@/lib/utils/getAvatarUrl";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Configuration objects for cleaner code
const THEME_CONFIG = {
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
  system: { icon: Monitor, label: "System" },
};

const ROLE_CONFIG = {
  [SystemRole.SUPER_ADMIN]: {
    icon: Shield,
    color: "text-red-600 bg-red-100 dark:bg-red-950/30 dark:text-red-400",
    label: "Super Admin",
  },
  [SystemRole.ADMIN]: {
    icon: Shield,
    color:
      "text-purple-600 bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400",
    label: "Admin",
  },
  [UserRole.PROVIDER]: {
    icon: TrendingUp,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400",
    label: "Service Provider",
  },
  [UserRole.CUSTOMER]: {
    icon: Users,
    color:
      "text-green-600 bg-green-100 dark:bg-green-950/30 dark:text-green-400",
    label: "Customer",
  },
  default: {
    icon: UserIcon,
    color: "text-gray-600 bg-gray-100 dark:bg-gray-950/30 dark:text-gray-400",
    label: "User",
  },
};

const SETTINGS_ITEMS = [
  { href: "/settings", icon: Settings, label: "Preferences", key: "settings" },
  { href: "/help", icon: HelpCircle, label: "Help & Support", key: "help" },
];

// Streamlined Theme Switcher
const ThemeSwitcher: React.FC = () => {
  const { setTheme, theme } = useTheme();
  const currentTheme =
    THEME_CONFIG[theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.system;
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <CurrentIcon className="mr-2 h-4 w-4" />
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {Object.entries(THEME_CONFIG).map(([key, { icon: Icon, label }]) => (
          <DropdownMenuItem key={key} onClick={() => setTheme(key)}>
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

// Streamlined Notification Button
const NotificationButton: React.FC<{ count?: number }> = ({ count = 0 }) => (
  <Button
    variant="ghost"
    size="icon"
    className="relative rounded-full hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
    asChild
  >
    <Link href="/notifications">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <motion.div
          className="absolute -top-1 -right-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Badge
            variant="destructive"
            className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        </motion.div>
      )}
    </Link>
  </Button>
);

// Streamlined Role Display
const RoleDisplay: React.FC<{ role: UserRole | SystemRole | string }> = ({
  role,
}) => {
  const config =
    ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.default;
  const Icon = config.icon;

  return (
    <Badge className={cn("text-xs px-2 py-1 gap-1 border-0", config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// Status Indicator Component
const StatusIndicator: React.FC<{
  type: "incomplete" | "verified";
  className?: string;
}> = ({ type, className }) => {
  const config =
    type === "verified"
      ? { bg: "bg-green-500", icon: CheckCircle }
      : { bg: "bg-yellow-500", icon: AlertCircle };

  return (
    <div
      className={cn(
        "absolute w-4 h-4 rounded-full flex items-center justify-center",
        config.bg,
        className
      )}
    >
      <config.icon className="h-3 w-3 text-white" />
    </div>
  );
};

// User Avatar Component
const UserAvatar: React.FC<{
  displayAvatar?: string;
  displayName: string;
  completeness?: number;
  isVerified?: boolean;
  size?: "sm" | "md";
}> = ({
  displayAvatar,
  displayName,
  completeness = 100,
  isVerified,
  size = "sm",
}) => {
  const avatarSize = size === "md" ? "h-12 w-12" : "h-9 w-9";

  return (
    <div className="relative">
      <Avatar
        className={cn(
          avatarSize,
          "ring-2 ring-offset-1 ring-gray-200/50 dark:ring-gray-700/50"
        )}
      >
        <AvatarImage
          src={getAvatarUrl(displayAvatar)}
          alt={`${displayName} avatar`}
        />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
          {displayName.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {completeness < 100 && (
        <StatusIndicator type="incomplete" className="-bottom-1 -right-1" />
      )}
      {isVerified && (
        <StatusIndicator type="verified" className="-top-1 -right-1" />
      )}
    </div>
  );
};

// Helper function to safely extract avatar URL
const getAvatarString = (
  avatar: string | { url?: string } | undefined
): string | undefined => {
  if (typeof avatar === "string") return avatar;
  if (avatar && typeof avatar === "object" && "url" in avatar)
    return avatar.url;
  return undefined;
};

interface UserMenuProps {
  user?: Partial<IUser>;
  profile?: IUserProfile | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onLogout: () => void;
  notificationCount?: number;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user = {},
  profile,
  isAdmin = false,
  isSuperAdmin = false,
  onLogout,
  notificationCount = 0,
}) => {
  const role = profile?.role as UserRole;

  const MENU_ITEMS = React.useMemo(
    () => [
      { href: "/profile", icon: UserIcon, label: "Profile", key: "profile" },
      {
        href:
          role === UserRole.PROVIDER
            ? "/provider-dashboard"
            : "/client-dashboard",
        icon: BarChart3,
        label: "Dashboard",
        key: "dashboard",
      },
    ],
    [role]
  );
  // Consolidated display values
  const display = {
    name: user?.name || "Unknown User",
    email: user?.email || "No email",
    avatar: getAvatarString(user?.avatar || profile?.profilePicture),
    role: profile?.role || user?.systemRole || SystemRole.USER,
    isVerified: profile?.verificationStatus === VerificationStatus.VERIFIED,
    isMarketplaceActive: profile?.isActiveInMarketplace || false,
  };

  const renderMenuItem = ({
    href,
    icon: Icon,
    label,
    key,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    key: string;
  }) => (
    <DropdownMenuItem key={key} asChild>
      <Link href={href} className="w-full cursor-pointer flex items-center">
        <Icon className="mr-3 h-4 w-4" />
        <span>{label}</span>
      </Link>
    </DropdownMenuItem>
  );

  return (
    <div className="flex items-center space-x-2">
      <NotificationButton count={notificationCount} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-50/80 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0"
          >
            <UserAvatar
              displayAvatar={display.avatar}
              displayName={display.name}
              isVerified={display.isVerified}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 p-0 z-[60]"
          align="end"
          sideOffset={8}
          side="bottom"
          avoidCollisions={true}
          collisionPadding={8}
          sticky="always"
        >
          {/* User Info Header */}
          <DropdownMenuLabel className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="w-full flex justify-start gap-2 items-start">
              <UserAvatar
                displayAvatar={display.avatar}
                displayName={display.name}
                size="md"
              />

              <div className="flex-1 flex flex-col items-start min-w-0 text-start">
                <p className="text-sm font-semibold leading-none truncate text-gray-900 dark:text-gray-100 capitalize">
                  {display.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                  {display.email}
                </p>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <RoleDisplay role={display.role} />
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <div className="p-2">
            {/* Main Menu Items */}
            <DropdownMenuGroup>
              {MENU_ITEMS.map(renderMenuItem)}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <ThemeSwitcher />
            <DropdownMenuSeparator />

            {/* Settings and Support */}
            <DropdownMenuGroup>
              {SETTINGS_ITEMS.map(renderMenuItem)}

              {(isAdmin || isSuperAdmin) && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="w-full cursor-pointer">
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
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-700"
              >
                <UserIcon className="mr-3 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
