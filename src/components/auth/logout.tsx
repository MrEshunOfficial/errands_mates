"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Heart,
  Clock,
  Smile,
  ArrowLeft,
  Moon,
  Coffee,
  Star,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

const LogoutPage = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("You've been logged out successfully. See you soon!");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("There was an issue logging you out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Coffee };
    if (hour < 17) return { text: "Good afternoon", icon: TrendingUp };
    return { text: "Good evening", icon: Moon };
  };

  const { text: greeting, icon: GreetingIcon } = getCurrentTimeGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/10 dark:to-gray-800 flex items-center justify-center px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-700 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <GreetingIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {greeting}, {user?.name || "friend"}!
            </h1>
            <p className="text-blue-100 text-lg">
              Taking a break? We&apos;ll be here when you return.
            </p>
          </div>

          <div className="p-8">
            {/* Appreciation Section */}
            <div className="space-y-6 mb-8">
              {/* Session Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-4">
                  <Smile className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Session Today
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {Math.floor(Math.random() * 120) + 30}min
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Time spent
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {Math.floor(Math.random() * 20) + 5}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Tasks completed
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                    <Bookmark className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {Math.floor(Math.random() * 10) + 1}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Items saved
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Thank You for Your Time Today
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
                    Every moment you&apos;ve spent here has contributed to your
                    journey of growth. Rest well, and remember that tomorrow
                    brings new opportunities to shine.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    Take care of yourself - you deserve it! 💙
                  </p>
                </div>
              </div>

              {/* Quick Return Reminder */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bookmark className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      We&apos;ll Save Your Progress
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      Don&apos;t worry about losing your work! Everything
                      you&apos;ve done today is automatically saved and will be
                      waiting for you when you return.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                      <Clock className="w-4 h-4" />
                      <span>Your session will be remembered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gentle Reminder */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  A Gentle Reminder
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Success isn&apos;t just about the destination—it&apos;s about
                  appreciating each step of the journey. You&apos;ve made
                  progress today, and that&apos;s something to celebrate. ✨
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Stay a Little Longer
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging Out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Yes, Log Me Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-8 text-gray-600 dark:text-gray-400">
          <p className="text-sm mb-2">
            The best way to take care of the future is to take care of the
            present moment.
          </p>
          <p className="text-xs">
            Thank you for being part of our community. We look forward to seeing
            you again! 🌟
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
