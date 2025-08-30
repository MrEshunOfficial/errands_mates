"use client";
import React, { useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  Settings,
  Shield,
  Users,
  Activity,
  BarChart3,
  FileText,
  Bell,
  UserCheck,
  AlertTriangle,
  Database,
  Home,
  LogOut,
  Crown,
  Zap,
  Eye,
  Store,
  Tag,
  Flag,
  Plus,
  List,
  Edit,
  Folder,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile } from "@/hooks/profiles/useProfile";
import { useAuth } from "@/hooks/auth/useAuth";
import { UserRole, SystemRole } from "@/types/base.types";
import { getAvatarUrl } from "@/lib/utils/getAvatarUrl";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { Button } from "@/components/ui/button";

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
  adminLevel?: "admin" | "super_admin" | "both";
  children?: NavigationItem[];
  isParent?: boolean;
}

interface QuickAction {
  label: string;
  action: () => void;
  priority: "high" | "normal" | "critical";
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface RoleIndicator {
  label: string;
  className: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/admin",
    label: "Admin Dashboard",
    icon: Home,
    description: "Main administrative overview",
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    adminLevel: "both",
  },
  {
    href: "/admin/analytics",
    label: "System Analytics",
    icon: BarChart3,
    description: "Platform usage and performance metrics",
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    adminLevel: "both",
    separator: true,
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    description: "Manage all platform users",
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    adminLevel: "both",
    isParent: true,
    children: [
      {
        href: "/admin/users",
        label: "All Users",
        icon: List,
        description: "View and manage all users",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/users/create",
        label: "Create User",
        icon: Plus,
        description: "Add new user to the system",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/users/verification",
        label: "User Verification",
        icon: UserCheck,
        description: "Review and manage user verifications",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/users/warnings",
        label: "User Warnings",
        icon: AlertTriangle,
        description: "Manage user warnings and violations",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
    ],
  },
  {
    href: "/admin/services",
    label: "Service Management",
    icon: Store,
    description: "Manage marketplace services",
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    adminLevel: "both",
    isParent: true,
    children: [
      {
        href: "/admin/services/categories",
        label: "Categories",
        icon: Tag,
        description: "Manage service categories",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/services/categories/create",
        label: "Create Category",
        icon: Plus,
        description: "Add new service category",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/services/service-list",
        label: "Service List",
        icon: List,
        description: "View all services",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/services/create",
        label: "Create Service",
        icon: Plus,
        description: "Add new service",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/services/marketplace",
        label: "Marketplace Oversight",
        icon: Eye,
        description: "Monitor marketplace activities",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/services/analytics",
        label: "Service Analytics",
        icon: Eye,
        description: "Monitor service activities",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/services/pending",
        label: "Pending Services",
        icon: Eye,
        description: "Manage Pending Services",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/services/popular",
        label: "Trending Services",
        icon: Eye,
        description: "Manage Trending Services",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
    ],
  },
  {
    href: "/admin/content",
    label: "Content Management",
    icon: Folder,
    description: "Manage platform content",
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    adminLevel: "both",
    isParent: true,
    children: [
      {
        href: "/admin/content/moderation",
        label: "Content Moderation",
        icon: Flag,
        description: "Review flagged content and moderation queue",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/content/reports",
        label: "Content Reports",
        icon: FileText,
        description: "Review user-reported content",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/content/bulk-actions",
        label: "Bulk Actions",
        icon: Edit,
        description: "Perform bulk content operations",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
    ],
  },
  {
    href: "/admin/system",
    label: "System Management",
    icon: Settings,
    description: "System monitoring and logs",
    systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
    adminLevel: "both",
    isParent: true,
    children: [
      {
        href: "/admin/system/monitoring",
        label: "System Monitoring",
        icon: Activity,
        description: "Real-time system health monitoring",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/system/audit-logs",
        label: "Audit Logs",
        icon: FileText,
        description: "System activity and security logs",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
      {
        href: "/admin/system/notifications",
        label: "System Notifications",
        icon: Bell,
        description: "Administrative notifications",
        systemRoles: [SystemRole.ADMIN, SystemRole.SUPER_ADMIN],
        adminLevel: "both",
      },
    ],
  },
  {
    href: "/super-admin",
    label: "Super Admin Panel",
    icon: Crown,
    description: "Advanced system administration",
    systemRoles: [SystemRole.SUPER_ADMIN],
    adminLevel: "super_admin",
    separator: true,
    isParent: true,
    children: [
      {
        href: "/super-admin/admins",
        label: "Admin Management",
        icon: Shield,
        description: "Manage administrator accounts",
        systemRoles: [SystemRole.SUPER_ADMIN],
        adminLevel: "super_admin",
      },
      {
        href: "/super-admin/admins/create",
        label: "Create Admin",
        icon: Plus,
        description: "Add new administrator",
        systemRoles: [SystemRole.SUPER_ADMIN],
        adminLevel: "super_admin",
      },
      {
        href: "/super-admin/system-config",
        label: "System Configuration",
        icon: Settings,
        description: "Core system settings and configuration",
        systemRoles: [SystemRole.SUPER_ADMIN],
        adminLevel: "super_admin",
      },
      {
        href: "/super-admin/database",
        label: "Database Management",
        icon: Database,
        description: "Database operations and maintenance",
        systemRoles: [SystemRole.SUPER_ADMIN],
        adminLevel: "super_admin",
      },
      {
        href: "/super-admin/security",
        label: "Security Center",
        icon: Eye,
        description: "Advanced security monitoring and controls",
        systemRoles: [SystemRole.SUPER_ADMIN],
        adminLevel: "super_admin",
      },
    ],
  },
];

const AdminNavigation: React.FC = () => {
  const pathname = usePathname();
  const { isLoading, profile } = useProfile();
  const { user } = useAuth();
  const router = useRouter();

  // State for managing expanded parent items
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );

  // All hooks must be called before any conditional returns
  const handleLogout = useCallback(() => {
    router.push("/logout");
  }, [router]);

  const isActiveRoute = useCallback(
    (href: string): boolean => {
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname]
  );

  const isParentActive = useCallback(
    (item: NavigationItem): boolean => {
      if (!item.children) return false;
      return item.children.some((child) => isActiveRoute(child.href));
    },
    [isActiveRoute]
  );

  const toggleExpanded = useCallback((href: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  }, []);

  // Auto-expand parent items if their children are active
  React.useEffect(() => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      navigationItems.forEach((item) => {
        if (item.isParent && item.children && isParentActive(item)) {
          newSet.add(item.href);
        }
      });
      return newSet;
    });
  }, [pathname, isParentActive]);

  const canAccessRoute = useCallback(
    (item: NavigationItem): boolean => {
      // Check system role permissions
      if (item.systemRoles && item.systemRoles.length > 0) {
        const userSystemRole = user?.systemRole as SystemRole;
        if (!userSystemRole || !item.systemRoles.includes(userSystemRole)) {
          return false;
        }
      }

      return true;
    },
    [user?.systemRole]
  );

  const getRoleIndicator = useCallback(
    (item: NavigationItem): RoleIndicator | null => {
      if (item.adminLevel === "super_admin") {
        return {
          label: "Super Admin",
          className:
            "bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm",
        };
      }

      if (
        item.systemRoles?.includes(SystemRole.SUPER_ADMIN) &&
        item.systemRoles?.includes(SystemRole.ADMIN)
      ) {
        return {
          label: "Admin+",
          className:
            "bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm",
        };
      }

      return null;
    },
    []
  );

  const handleNavigation = useCallback(
    (item: NavigationItem) => {
      if (item.isParent) {
        toggleExpanded(item.href);
      } else if (canAccessRoute(item)) {
        router.push(item.href);
      }
    },
    [canAccessRoute, router, toggleExpanded]
  );

  const filteredItems = useMemo(
    () => navigationItems.filter((item) => canAccessRoute(item)),
    [canAccessRoute]
  );

  const displayName = useMemo(() => {
    return user?.systemRole === SystemRole.SUPER_ADMIN
      ? user?.systemAdminName || user?.name || "Super Admin"
      : user?.name || "Admin";
  }, [user?.systemRole, user?.systemAdminName, user?.name]);

  const displayAvatar = useMemo(() => {
    return user?.avatar || profile?.profilePicture?.url;
  }, [user?.avatar, profile?.profilePicture?.url]);

  // Recursive component to render navigation items with nesting
  const NavigationItemRenderer: React.FC<{
    item: NavigationItem;
    index: number;
    level?: number;
  }> = useCallback(
    ({ item, index, level = 0 }) => {
      const Icon = item.icon;
      const isActive = isActiveRoute(item.href);
      const isExpanded = expandedItems.has(item.href);
      const showSeparator = item.separator && index > 0 && level === 0;
      const roleIndicator = getRoleIndicator(item);
      const parentIsActive = isParentActive(item);

      return (
        <React.Fragment key={`${item.href}-${level}`}>
          {showSeparator && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-3 mx-2" />
          )}
          <div className={level > 0 ? "ml-4" : ""}>
            <button
              onClick={() => handleNavigation(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 my-1 mx-1 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                isActive || (item.isParent && parentIsActive)
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100 shadow-sm border border-blue-200 dark:border-blue-800"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
              title={item.description}
              aria-current={isActive ? "page" : undefined}
              aria-expanded={item.isParent ? isExpanded : undefined}>
              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors ${
                  isActive || (item.isParent && parentIsActive)
                    ? "text-blue-600 dark:text-blue-400"
                    : ""
                } ${item.adminLevel === "super_admin" ? "text-red-500" : ""}`}
                aria-hidden="true"
              />

              <span className="truncate font-medium text-sm text-left flex-1">
                {item.label}
              </span>

              {/* Expand/Collapse indicator for parent items */}
              {item.isParent && (
                <div className="flex-shrink-0 ml-2">
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </div>
              )}

              {/* Role indicators */}
              {roleIndicator && !item.isParent && (
                <span
                  className={`ml-auto flex-shrink-0 ${roleIndicator.className}`}
                  aria-label={`Requires ${roleIndicator.label} privileges`}>
                  {roleIndicator.label}
                </span>
              )}
            </button>

            {/* Render children if parent is expanded */}
            {item.isParent && item.children && isExpanded && (
              <div className="mt-1 space-y-0.5">
                {item.children
                  .filter((child) => canAccessRoute(child))
                  .map((child, childIndex) => (
                    <NavigationItemRenderer
                      key={child.href}
                      item={child}
                      index={childIndex}
                      level={level + 1}
                    />
                  ))}
              </div>
            )}
          </div>
        </React.Fragment>
      );
    },
    [
      isActiveRoute,
      expandedItems,
      handleNavigation,
      getRoleIndicator,
      isParentActive,
      canAccessRoute,
    ]
  );

  // Early return if user doesn't have admin privileges
  if (
    !user ||
    (user.systemRole !== SystemRole.ADMIN &&
      user.systemRole !== SystemRole.SUPER_ADMIN)
  ) {
    return (
      <div className="max-h-screen overflow-auto w-80 flex flex-col border rounded-md p-4 items-center justify-center">
        <Shield className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 text-center">
          Administrative access required
        </p>
      </div>
    );
  }

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
      {/* Admin Profile Section */}
      <div className="flex-shrink-0 mb-4 px-2">
        <div className="relative">
          <div className="relative group">
            <AvatarPrimitive.Root className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ring-2 ring-blue-200/50 dark:ring-blue-700/50 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/20 dark:group-hover:shadow-blue-500/30 group-hover:scale-[1.02] rounded-xl">
              <AvatarPrimitive.Image
                className="h-32 w-full rounded-xl object-cover transition-transform duration-500"
                src={getAvatarUrl(displayAvatar)}
                alt={`${displayName} avatar`}
              />
              <AvatarPrimitive.Fallback className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-2xl font-bold text-white rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-purple-400/20 animate-pulse" />
                <span className="relative z-10 drop-shadow-sm flex items-center gap-1">
                  {user.systemRole === SystemRole.SUPER_ADMIN && (
                    <Crown size={20} />
                  )}
                  {displayName?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </AvatarPrimitive.Fallback>

              {/* Admin Badge Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate drop-shadow-sm flex items-center gap-1">
                      {user.systemRole === SystemRole.SUPER_ADMIN && (
                        <Crown size={14} className="text-yellow-300" />
                      )}
                      {displayName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-md border shadow-lg ${
                          user.systemRole === SystemRole.SUPER_ADMIN
                            ? "bg-red-500/90 text-white border-red-300/50"
                            : "bg-blue-500/90 text-white border-blue-300/50"
                        }`}>
                        <Shield size={10} className="mr-1" />
                        {user.systemRole === SystemRole.SUPER_ADMIN
                          ? "Super Admin"
                          : "Administrator"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                  </div>
                </div>
              </div>
            </AvatarPrimitive.Root>
          </div>

          {/* System Status Badge */}
          <div className="absolute -top-2 -right-2 z-10">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-400/30 blur-md animate-pulse" />
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xl shadow-green-500/30 border border-green-300/50 flex items-center gap-1">
                <Zap size={10} className="animate-pulse" />
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1">
        <nav
          className="space-y-1 p-2"
          role="navigation"
          aria-label="Admin navigation">
          {filteredItems.map((item, index) => (
            <NavigationItemRenderer key={item.href} item={item} index={index} />
          ))}
        </nav>
      </ScrollArea>

      {/* Quick Actions for Admins */}
      <div className="my-2 w-full">
        <AdminQuickActions />
      </div>

      {/* Logout Button */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-2 pt-3 px-1">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 font-medium text-sm group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          title="Sign out of admin account"
          aria-label="Sign out of admin account">
          <LogOut size={18} className="flex-shrink-0" aria-hidden="true" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export const AdminQuickActions: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const generateAdminQuickActions = useCallback((): QuickAction[] => {
    const actions: QuickAction[] = [];

    if (
      !user ||
      (user.systemRole !== SystemRole.ADMIN &&
        user.systemRole !== SystemRole.SUPER_ADMIN)
    ) {
      return actions;
    }

    // Critical system alerts
    actions.push({
      label: "System Health Check",
      action: () => router.push("/admin/monitoring"),
      priority: "high",
      icon: Activity,
    });

    // Pending verifications (high priority for admins)
    actions.push({
      label: "Pending Verifications",
      action: () => router.push("/admin/verification?status=pending"),
      priority: "high",
      icon: UserCheck,
    });

    // Moderation queue
    actions.push({
      label: "Moderation Queue",
      action: () => router.push("/admin/moderation?status=pending"),
      priority: "normal",
      icon: Flag,
    });

    // Recent warnings issued
    actions.push({
      label: "Recent Warnings",
      action: () => router.push("/admin/warnings?filter=recent"),
      priority: "normal",
      icon: AlertTriangle,
    });

    // Super Admin specific actions
    if (user.systemRole === SystemRole.SUPER_ADMIN) {
      actions.push({
        label: "Admin Activity Log",
        action: () => router.push("/super-admin/audit-log?type=admin"),
        priority: "normal",
        icon: FileText,
      });

      actions.push({
        label: "Security Center",
        action: () => router.push("/super-admin/security"),
        priority: "critical",
        icon: Eye,
      });
    }

    return actions;
  }, [user, router]);

  const actions = useMemo(
    () => generateAdminQuickActions(),
    [generateAdminQuickActions]
  );

  if (actions.length === 0) return null;

  return (
    <div className="flex-shrink-0 mt-2 p-2 border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 px-3 flex items-center gap-2">
        <Zap size={14} />
        Quick Actions
      </h4>
      <ScrollArea className="max-h-48 overflow-auto">
        <div
          className="space-y-1 p-1"
          role="list"
          aria-label="Admin quick actions">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={`${action.label}-${index}`}
                onClick={action.action}
                className={`w-full text-left px-3 py-2.5 mx-1 text-sm rounded-lg transition-all duration-200 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  action.priority === "critical"
                    ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 font-medium border border-red-200 dark:border-red-800"
                    : action.priority === "high"
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
                role="listitem"
                aria-label={action.label}>
                <Icon
                  size={16}
                  className={`flex-shrink-0 ${
                    action.priority === "critical"
                      ? "text-red-600"
                      : action.priority === "high"
                      ? "text-blue-600"
                      : ""
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdminNavigation;
