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
import { Button } from "../ui/button";

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
    href: "/settings",
    label: "Preferences",
    icon: Settings,
    description: "Manage your account preferences",
  },
  {
    href: "/activity",
    label: "Dashboard",
    icon: Activity,
    description: "View your recent activity",
    separator: true,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Your notifications",
  },
  {
    href: "/provider-dashboard",
    label: "Provider Dashboard",
    icon: BarChart3,
    userRoles: [UserRole.PROVIDER],
    requiresMarketplaceActive: true,
    description: "Service provider dashboard",
    separator: true,
  },
  {
    href: "/service-offered",
    label: "My Services",
    icon: Store,
    userRoles: [UserRole.PROVIDER],
    description: "Manage your services",
  },
  {
    href: "/client-requested",
    label: "Requests",
    icon: Users,
    userRoles: [UserRole.PROVIDER],
    description: "View and manage requests",
  },
  {
    href: "/request-history",
    label: "My Requests",
    icon: Users,
    userRoles: [UserRole.CUSTOMER],
    description: "Manage Requested Services",
    separator: true,
  },
  {
    href: "/privacy",
    label: "Privacy",
    icon: Lock,
    description: "Privacy and security settings",
  },
  {
    href: "/help",
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

const ProfileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { isLoading, profile } = useProfile();
  const { user } = useAuth();
  const router = useRouter();

  const displayName = user?.name || "Unknown User";
  const displayAvatar = user?.avatar || profile?.profilePicture?.url;

  // Move all hooks before any conditional returns

  const handleLogout = () => {
    router.push("/logout");
  };

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

  if (isLoading && !user) {
    return (
      <div className="flex flex-col min-h-screen animate-pulse">
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          {Array.from({ length: 10 }).map((_, i) => (
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
    <div className="max-h-screen overflow-auto w-80 flex flex-col border rounded-md p-2 hide-scrollbar">
      {user && profile && (
        <div className="flex-shrink-0 mb-2 px-2">
          <div className="relative">
            {/* Main Profile Card */}
            <div className="relative group">
              <AvatarPrimitive.Root className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30 group-hover:scale-[1.02]">
                <AvatarPrimitive.Image
                  className="h-40 w-full rounded-md transition-transform duration-500"
                  src={getAvatarUrl(displayAvatar)}
                  alt={`${displayName} avatar`}
                />
                <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-2xl font-bold text-white rounded-2xl relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-400/30 via-transparent to-fuchsia-400/30 animate-pulse" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,119,198,0.3),_transparent_50%)] animate-pulse" />
                  <span className="relative z-10 drop-shadow-sm">
                    {displayName.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </AvatarPrimitive.Fallback>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent backdrop-blur-sm px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-white truncate drop-shadow-sm">
                        {user.name || "User"}
                      </p>
                      {profile.role && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 bg-white/25 text-white rounded-full backdrop-blur-md border border-white/20 shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                            {profile.role === UserRole.PROVIDER
                              ? "Service Provider"
                              : "Customer"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Subtle border glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 via-transparent to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </AvatarPrimitive.Root>
            </div>

            {/* Floating verification badge */}
            {profile.verificationStatus === "verified" && (
              <div className="absolute -top-2 -right-2 z-10">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-md animate-pulse" />
                  {/* Badge */}
                  <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl shadow-emerald-500/30 border border-emerald-300/50 flex items-center gap-1.5">
                    <svg
                      className="w-3 h-3 animate-pulse"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </div>
                </div>
              </div>
            )}

            {/* Subtle decorative elements */}
            <div className="absolute -z-10 top-4 left-4 w-8 h-8 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 rounded-full blur-xl" />
            <div className="absolute -z-10 bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-xl" />
          </div>

          {/* Additional status indicators */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-3">
              {profile.isActiveInMarketplace && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </div>
              )}

              {profile.completeness && profile.completeness < 100 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {profile.completeness}% Complete
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Navigation Area */}
      <>
        <ScrollArea className="">
          <nav
            className="space-y-1 p-2"
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
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  )}
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 my-2 mx-1 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
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
      </>

      <div className="my-2 w-full">
        <QuickActions />
      </div>

      {/* Fixed Logout Button at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-2 pt-3 px-1">
        <Button
          onClick={handleLogout}
          variant={"outline"}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 font-medium text-sm group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          title="Sign out of your account"
          aria-label="Sign out of your account">
          <LogOut size={18} className="flex-shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </Button>
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
    <div className="flex-shrink-0 mt-2 p-2 border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-3">
        Quick Actions
      </h4>
      <>
        <ScrollArea className="max-h-min overflow-auto">
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
      </>
    </div>
  );
};

export default ProfileNavigation;
