"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  Settings,
  Edit,
  HelpCircle,
  LogOut,
  Shield,
  Activity,
  Heart,
  MessageCircle,
  Bell,
  FileText,
  Camera,
  MapPin,
  UserCheck,
  Lock,
  Store,
  BarChart3,
  Users,
  Flag,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile } from "@/hooks/profiles/useProfile";
import { useAuth } from "@/hooks/auth/useAuth";
import { UserRole, SystemRole } from "@/types/base.types";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  systemRoles?: SystemRole[]; // For system-level permissions (admin, super_admin)
  userRoles?: UserRole[]; // For user profile roles (customer, service_provider)
  requiresVerification?: boolean; // Requires verified status
  requiresMarketplaceActive?: boolean; // Requires marketplace participation
  separator?: boolean;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  // Core Profile Management - Available to all authenticated users
  {
    href: "/profile",
    label: "My Profile",
    icon: User,
    description: "View your profile information",
  },
  {
    href: "/update-profile",
    label: "Edit Profile",
    icon: Edit,
    description: "Update your profile details",
  },
  {
    href: "/profile/settings",
    label: "Preferences",
    icon: Settings,
    description: "Manage your account preferences",
  },

  // User Activity & Social Features
  {
    href: "/profile/activity",
    label: "Activity",
    icon: Activity,
    description: "View your recent activity",
    separator: true,
  },
  {
    href: "/profile/favorites",
    label: "Favorites",
    icon: Heart,
    description: "Items you've favorited",
  },
  {
    href: "/profile/messages",
    label: "Messages",
    icon: MessageCircle,
    description: "Your conversations",
  },
  {
    href: "/profile/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Your notifications",
  },

  // Content & Media Management
  {
    href: "/profile/posts",
    label: "My Posts",
    icon: FileText,
    description: "Content you've created",
    separator: true,
  },
  {
    href: "/profile/photos",
    label: "Photos",
    icon: Camera,
    description: "Your photo gallery",
  },
  {
    href: "/profile/locations",
    label: "Saved Places",
    icon: MapPin,
    description: "Places you've saved",
  },

  // Service Provider Specific Features
  {
    href: "/provider/dashboard",
    label: "Provider Dashboard",
    icon: BarChart3,
    userRoles: [UserRole.PROVIDER],
    requiresMarketplaceActive: true,
    description: "Service provider dashboard",
    separator: true,
  },
  {
    href: "/provider/services",
    label: "My Services",
    icon: Store,
    userRoles: [UserRole.PROVIDER],
    description: "Manage your services",
  },
  {
    href: "/provider/bookings",
    label: "Bookings",
    icon: Users,
    userRoles: [UserRole.PROVIDER],
    description: "View and manage bookings",
  },

  // Customer Specific Features
  {
    href: "/customer/bookings",
    label: "My Bookings",
    icon: Users,
    userRoles: [UserRole.CUSTOMER],
    description: "Your service bookings",
    separator: true,
  },

  // Account Management
  {
    href: "/profile/verification",
    label: "Verification",
    icon: UserCheck,
    description: "Account verification status",
    separator: true,
  },
  {
    href: "/profile/privacy",
    label: "Privacy",
    icon: Lock,
    description: "Privacy and security settings",
  },
  {
    href: "/profile/help",
    label: "Help & Support",
    icon: HelpCircle,
    description: "Get help and support",
  },

  // Admin Dashboard - System role based
  {
    href: "/admin",
    label: "Admin Dashboard",
    icon: Shield,
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    separator: true,
    description: "Administrative functions",
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    description: "Manage users",
  },
  {
    href: "/admin/moderation",
    label: "Content Moderation",
    icon: Flag,
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    description: "Moderate content",
  },
];

// Utility function for safe storage operations
const safeStorageOperation = (operation: () => void) => {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      window.sessionStorage
    ) {
      operation();
    }
  } catch (error) {
    console.warn("Storage operation failed:", error);
  }
};

const ProfileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { isLoading, profile } = useProfile();
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      safeStorageOperation(() => {
        localStorage.removeItem("authToken");
        sessionStorage.clear();
      });

      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  };

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const canAccessRoute = (item: NavigationItem) => {
    // Always allow access if no restrictions are specified
    if (
      !item.systemRoles &&
      !item.userRoles &&
      !item.requiresVerification &&
      !item.requiresMarketplaceActive
    ) {
      return true;
    }

    // Check system role permissions (admin, super_admin)
    if (item.systemRoles && item.systemRoles.length > 0) {
      const userSystemRole = user?.systemRole as SystemRole;
      if (!userSystemRole || !item.systemRoles.includes(userSystemRole)) {
        return false;
      }
    }

    // Check user profile role permissions (customer, service_provider)
    if (item.userRoles && item.userRoles.length > 0) {
      const userProfileRole = profile?.role as UserRole;
      if (!userProfileRole || !item.userRoles.includes(userProfileRole)) {
        return false;
      }
    }

    // Check verification requirement
    if (
      item.requiresVerification &&
      profile?.verificationStatus !== "verified"
    ) {
      return false;
    }

    // Check marketplace active requirement
    if (item.requiresMarketplaceActive && !profile?.isActiveInMarketplace) {
      return false;
    }

    return true;
  };

  const getFilteredNavigationItems = () => {
    return navigationItems.filter((item) => canAccessRoute(item));
  };

  const getRoleIndicator = (item: NavigationItem) => {
    if (item.systemRoles && item.systemRoles.length > 0) {
      const hasAdmin = item.systemRoles.includes(SystemRole.ADMIN);
      const hasSuperAdmin = item.systemRoles.includes(SystemRole.SUPER_ADMIN);

      if (hasSuperAdmin && hasAdmin) {
        return {
          label: "Admin+",
          className:
            "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        };
      } else if (hasSuperAdmin) {
        return {
          label: "Super Admin",
          className:
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
      } else {
        return {
          label: "Admin",
          className:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        };
      }
    }

    if (item.userRoles && item.userRoles.length > 0) {
      if (item.userRoles.includes(UserRole.PROVIDER)) {
        return {
          label: "Provider",
          className:
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        };
      }
      if (item.userRoles.includes(UserRole.CUSTOMER)) {
        return {
          label: "Customer",
          className:
            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        };
      }
    }

    return null;
  };

  const filteredItems = getFilteredNavigationItems();

  // Show loading state if profile is still loading
  if (isLoading && !user) {
    return (
      <div className="flex flex-col h-full min-h-0 animate-pulse">
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full min-h-0"
      data-testid="dashboard-navigation"
    >
      {/* User Info Header */}
      {user && profile && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <User size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user.name || "User"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {profile.role && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                    {profile.role === UserRole.PROVIDER
                      ? "Service Provider"
                      : "Customer"}
                  </span>
                )}
                {profile.verificationStatus === "verified" && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Navigation Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-[650px] overflow-scroll hide-scrollbar ">
          <nav
            className="space-y-1 p-1"
            role="navigation"
            aria-label="Dashboard navigation"
          >
            {filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              const showSeparator = item.separator && index > 0;
              const roleIndicator = getRoleIndicator(item);

              return (
                <React.Fragment key={item.href}>
                  {showSeparator && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-3 mx-2" />
                  )}
                  <a
                    href={user && canAccessRoute(item) ? item.href : "/login"}
                    className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                      isActive
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    title={item.description}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      size={18}
                      className={`flex-shrink-0 transition-colors ${
                        isActive ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium text-sm">
                      {item.label}
                    </span>

                    {/* Role indicators */}
                    {roleIndicator && (
                      <span
                        className={`ml-auto flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${roleIndicator.className}`}
                        aria-label={`Requires ${roleIndicator.label} role`}
                      >
                        {roleIndicator.label}
                      </span>
                    )}
                  </a>
                </React.Fragment>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* Fixed Logout Button at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-2 pt-3 px-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 font-medium text-sm group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          title="Sign out of your account"
          aria-label="Sign out of your account"
        >
          <LogOut size={18} className="flex-shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export const QuickActions: React.FC = () => {
  const router = useRouter();
  const { profile, completeness, activitySummary } = useProfile();
  const { user } = useAuth();

  if (!user || !profile) return null;

  const actions = [];

  // Add complete profile action if profile is incomplete
  if (completeness !== undefined && completeness < 100) {
    actions.push({
      label: `Complete Profile (${completeness}%)`,
      action: () => router.push("/profile/edit"),
      priority: "high" as const,
      icon: Edit,
    });
  }

  // Add verification action if not verified
  if (profile.verificationStatus !== "verified") {
    actions.push({
      label: "Verify Account",
      action: () => router.push("/profile/verification"),
      priority: "high" as const,
      icon: UserCheck,
    });
  }

  // Add marketplace activation for providers
  if (profile.role === UserRole.PROVIDER && !profile.isActiveInMarketplace) {
    actions.push({
      label: "Activate Marketplace",
      action: () => router.push("/provider/activate"),
      priority: "high" as const,
      icon: Store,
    });
  }

  // Add activity-based quick actions
  if (activitySummary) {
    if (activitySummary.completeness > 0) {
      actions.push({
        label: `${activitySummary.accountAge} Unread Message${activitySummary.moderationStatus}`,
        action: () => router.push("/profile/messages"),
        priority: "normal" as const,
        icon: MessageCircle,
      });
    }

    if (activitySummary.isActiveInMarketplace) {
      actions.push({
        label: `${activitySummary.moderationStatus} Notification${
          activitySummary.preferencesLastUpdated ? "" : "s"
        }`,
        action: () => router.push("/profile/notifications"),
        priority: "normal" as const,
        icon: Bell,
      });
    }
  }

  // Add role-specific quick actions
  if (profile.role === UserRole.PROVIDER) {
    actions.push({
      label: "Provider Dashboard",
      action: () => router.push("/provider/dashboard"),
      priority: "normal" as const,
      icon: BarChart3,
    });
  }

  // Add admin quick actions
  if (
    user.systemRole === SystemRole.ADMIN ||
    user.systemRole === SystemRole.SUPER_ADMIN
  ) {
    actions.push({
      label: "Admin Dashboard",
      action: () => router.push("/admin"),
      priority: "normal" as const,
      icon: Shield,
    });
  }

  // Add privacy settings action
  actions.push({
    label: "Privacy Settings",
    action: () => router.push("/profile/privacy"),
    priority: "normal" as const,
    icon: Lock,
  });

  if (actions.length === 0) return null;

  return (
    <div className="flex-shrink-0 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-3">
        Quick Actions
      </h4>
      <div className="max-h-40 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-1" role="list" aria-label="Quick actions">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-full text-left px-3 py-2.5 mx-1 text-sm rounded-lg transition-all duration-200 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    action.priority === "high"
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                  role="listitem"
                  aria-label={action.label}
                >
                  {Icon && (
                    <Icon
                      size={16}
                      className="flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{action.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ProfileNavigation;
