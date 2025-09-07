// components/profile/StatusBadge.tsx
"use client";

import React from "react";
import { CheckCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  role: string;
  type?: "role" | "verification" | "status";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  role,
  type = "role",
}) => {
  const getVariant = (
    role: string,
    type: string
  ): "default" | "secondary" | "success" | "warning" | "danger" => {
    const roleLower = role.toLowerCase();

    if (type === "verification") {
      if (roleLower.includes("verified")) return "success";
      if (roleLower.includes("pending")) return "warning";
      if (roleLower.includes("rejected")) return "danger";
    }

    if (roleLower.includes("admin")) return "secondary";
    if (roleLower.includes("provider")) return "default";
    return "default";
  };

  const getIcon = () => {
    if (type === "verification")
      return <CheckCircle className="w-3 h-3 mr-1" />;
    if (type === "role") return <Shield className="w-3 h-3 mr-1" />;
    return null;
  };

  return (
    <Badge variant={getVariant(role, type)}>
      {getIcon()}
      {role}
    </Badge>
  );
};
