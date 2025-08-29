"use client";
import React, { useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  User,
  Settings,
  Edit,
  HelpCircle,
  LogOut,
  Shield,
  Activity,
  MessageCircle,
  Bell,
  UserCheck,
  Lock,
  Store,
  BarChart3,
  Users,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile } from "@/hooks/profiles/useProfile";
import { useAuth } from "@/hooks/auth/useAuth";
import { UserRole, SystemRole } from "@/types/base.types";
import { getAvatarUrl } from "@/lib/utils/getAvatarUrl";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

// Add type definitions for better type safety
type VerificationStatus = "pending" | "verified" | "rejected";
type ModerationStatus = "pending" | "approved" | "flagged" | "suspended";

interface ActivitySummary {
  userId: string;
  profileId: string;
  lastModified?: Date;
  lastModeratedAt?: Date;
  verificationStatus: VerificationStatus;
  moderationStatus: ModerationStatus;
  warningsCount: number;
  completeness: number;
  isActiveInMarketplace: boolean;
  accountAge: number;
  preferencesLastUpdated?: Date;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  systemRoles?: SystemRole[];
  userRoles?: UserRole[];
  requiresVerification?: boolean;
  requiresMarketplaceActive?: boolean;
  separator?: boolean;
  description?: string;
}

interface QuickAction {
  label: string;
  action: () => void;
  priority: "high" | "normal";
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface RoleIndicator {
  label: string;
  className: string;
}

const navigationItems: NavigationItem[] = [
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
  {
    href: "/profile/activity",
    label: "Dashboard",
    icon: Activity,
    description: "View your recent activity",
    separator: true,
  },
  {
    href: "/profile/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Your notifications",
  },
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
    href: "/provider/requests",
    label: "Requests",
    icon: Users,
    userRoles: [UserRole.PROVIDER],
    description: "View and manage requests",
  },
  {
    href: "/customer/requests",
    label: "My Requests",
    icon: Users,
    userRoles: [UserRole.CUSTOMER],
    description: "Manage Requested Services",
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
  {
    href: "/admin",
    label: "Admin Dashboard",
    icon: Shield,
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    separator: true,
    description: "Administrative functions",
  },
];

// Utility function for safe storage operations
const safeStorageOperation = (operation: () => void): void => {
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

  const displayName = user?.name || "Unknown User";
  const displayAvatar = user?.avatar || profile?.profilePicture?.url;

  // Move all hooks before any conditional returns
  const handleLogout = useCallback(async () => {
    try {
      safeStorageOperation(() => {
        localStorage.removeItem("authToken");
        sessionStorage.clear();
      });
      await router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/login");
    }
  }, [router]);

  const isActiveRoute = useCallback(
    (href: string): boolean => {
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  const canAccessRoute = useCallback(
    (item: NavigationItem): boolean => {
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
    },
    [
      user?.systemRole,
      profile?.role,
      profile?.verificationStatus,
      profile?.isActiveInMarketplace,
    ]
  );

  const getRoleIndicator = useCallback(
    (item: NavigationItem): RoleIndicator | null => {
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
    },
    []
  );

  const handleNavigation = useCallback(
    (item: NavigationItem) => {
      const href = user && canAccessRoute(item) ? item.href : "/login";
      router.push(href);
    },
    [user, canAccessRoute, router]
  );

  const filteredItems = useMemo(
    () => navigationItems.filter((item) => canAccessRoute(item)),
    [canAccessRoute]
  );

  // Show loading state if profile is still loading - moved after all hooks
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
      data-testid="dashboard-navigation">
      {/* User Info Header */}
      {user && profile && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center gap-3">
            <AvatarPrimitive.Root className="inline-flex h-20 w-20 select-none items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ring-2 ring-offset-1 ring-gray-200/50 dark:ring-gray-700/50">
              <AvatarPrimitive.Image
                className="h-full w-full rounded-lg object-cover"
                src={getAvatarUrl(displayAvatar)}
                alt={`${displayName} avatar`}
              />
              <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-medium text-white rounded-lg">
                {displayName.charAt(0)?.toUpperCase() || "U"}
              </AvatarPrimitive.Fallback>
            </AvatarPrimitive.Root>
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
        <ScrollArea className="h-[750px] overflow-scroll hide-scrollbar">
          <nav
            className="space-y-1 p-1"
            role="navigation"
            aria-label="Dashboard navigation">
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
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                      isActive
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                    title={item.description}
                    aria-current={isActive ? "page" : undefined}>
                    <Icon
                      size={18}
                      className={`flex-shrink-0 transition-colors ${
                        isActive ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium text-sm text-left">
                      {item.label}
                    </span>

                    {/* Role indicators */}
                    {roleIndicator && (
                      <span
                        className={`ml-auto flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${roleIndicator.className}`}
                        aria-label={`Requires ${roleIndicator.label} role`}>
                        {roleIndicator.label}
                      </span>
                    )}
                  </button>
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
          aria-label="Sign out of your account">
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

  const generateQuickActions = useCallback((): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (!user || !profile) return actions;

    // Add complete profile action if profile is incomplete
    if (completeness !== undefined && completeness < 100) {
      actions.push({
        label: `Complete Profile (${completeness}%)`,
        action: () => router.push("/profile/edit"),
        priority: "high",
        icon: Edit,
      });
    }

    // Add verification action if not verified
    if (profile.verificationStatus !== "verified") {
      actions.push({
        label: "Verify Account",
        action: () => router.push("/profile/verification"),
        priority: "high",
        icon: UserCheck,
      });
    }

    // Add marketplace activation for providers
    if (profile.role === UserRole.PROVIDER && !profile.isActiveInMarketplace) {
      actions.push({
        label: "Activate Marketplace",
        action: () => router.push("/provider/activate"),
        priority: "high",
        icon: Store,
      });
    }

    // Add activity-based quick actions
    if (activitySummary) {
      // Fix the type comparison and provide meaningful message count
      const messageCount = activitySummary.accountAge || 0;
      if (messageCount > 0) {
        actions.push({
          label: `${messageCount} Unread Message${
            messageCount !== 1 ? "s" : ""
          }`,
          action: () => router.push("/profile/messages"),
          priority: "normal",
          icon: MessageCircle,
        });
      }

      // Fix notification count logic
      if (activitySummary.isActiveInMarketplace) {
        const notificationCount = activitySummary.warningsCount || 0;
        if (notificationCount > 0) {
          actions.push({
            label: `${notificationCount} Notification${
              notificationCount !== 1 ? "s" : ""
            }`,
            action: () => router.push("/profile/notifications"),
            priority: "normal",
            icon: Bell,
          });
        }
      }
    }

    // Add role-specific quick actions
    if (profile.role === UserRole.PROVIDER) {
      actions.push({
        label: "Provider Dashboard",
        action: () => router.push("/provider/dashboard"),
        priority: "normal",
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
        priority: "normal",
        icon: Shield,
      });
    }

    // Add privacy settings action
    actions.push({
      label: "Privacy Settings",
      action: () => router.push("/profile/privacy"),
      priority: "normal",
      icon: Lock,
    });

    return actions;
  }, [user, profile, completeness, activitySummary, router]);

  const actions = useMemo(() => generateQuickActions(), [generateQuickActions]);

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
                  key={`${action.label}-${index}`}
                  onClick={action.action}
                  className={`w-full text-left px-3 py-2.5 mx-1 text-sm rounded-lg transition-all duration-200 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    action.priority === "high"
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                  role="listitem"
                  aria-label={action.label}>
                  <Icon
                    size={16}
                    className="flex-shrink-0"
                    aria-hidden="true"
                  />
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
