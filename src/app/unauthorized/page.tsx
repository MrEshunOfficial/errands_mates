"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldX,
  Home,
  ArrowLeft,
  Lock,
  AlertTriangle,
  Mail,
  Phone,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function UnauthorizedPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/10 dark:to-orange-900/10">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-200/30 dark:bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-200/40 dark:bg-orange-500/10 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-yellow-200/20 dark:bg-yellow-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-red-300/30 dark:bg-red-400/10 rounded-full blur-xl animate-pulse delay-500"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Main Card */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-red-200/50 dark:border-red-800/50 shadow-2xl">
            <CardHeader className="text-center pb-8">
              {/* Icon with animation */}
              <div className="mx-auto relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <ShieldX className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
                  <AlertTriangle className="w-3 h-3 text-yellow-800" />
                </div>
              </div>

              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
                Access Denied
              </CardTitle>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                Oops! You&apos;ve hit a restricted area
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Error Description */}
              <div className="text-center space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <Lock className="w-8 h-8 text-red-500 mx-auto mb-3" />
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    You don&apos;t have the necessary permissions to view this
                    page. This could be due to insufficient privileges or an
                    expired session.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center justify-center group hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                    Go Back
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group transition-all duration-200 flex-1"
                  >
                    <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Go to Dashboard
                  </Button>
                </div>

                {/* Additional Help */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                    Need help? Contact our support team
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/contact")}
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 group"
                    >
                      <Mail className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Email Support
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open("tel:+1234567890")}
                      className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 group"
                    >
                      <Phone className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Call Us
                    </Button>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">?</span>
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">
                      You may be seeing this message because:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                      <li>Your session has expired — please sign in again</li>
                      <li>
                        You don’t currently have the required role or
                        permissions
                      </li>
                      <li>This page is limited to administrators</li>
                    </ul>
                    <p className="mt-2 text-blue-700 dark:text-blue-300">
                      If you believe this is a mistake, please contact support
                      or your administrator.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Code Display */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                ERROR 403 - FORBIDDEN
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: linear-gradient(
              rgba(255, 0, 0, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
}
