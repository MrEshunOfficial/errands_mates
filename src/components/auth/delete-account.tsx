"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  AlertTriangle,
  Heart,
  Clock,
  Users,
  ArrowLeft,
  Shield,
  Database,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/auth/useAuth";

const AccountDeletePage = () => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");

  const router = useRouter();
  const { deleteAccount, isLoading, user } = useAuth();

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success("Your account has been permanently deleted");
      router.push("/");
    } catch (error) {
      console.error("Delete account error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const isConfirmationValid =
    confirmationInput.toLowerCase() === "delete my account";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-red-900/10 dark:to-gray-800 flex items-center justify-center px-4 py-8 transition-colors duration-200">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Delete Your Account
            </h1>
            <p className="text-red-100 text-lg">
              We&apos;re sorry to see you go, {user?.name || "friend"}
            </p>
          </div>

          <div className="p-8">
            {!isConfirming ? (
              <>
                {/* Sentimental Section */}
                <div className="space-y-6 mb-8">
                  {/* Journey Stats */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <Heart className="w-6 h-6 text-red-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Your Journey With Us
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                        <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {user?.createdAt
                            ? Math.floor(
                                (Date.now() -
                                  new Date(user.createdAt).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : "Many"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Days with us
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                        <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          ∞
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Memories created
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Impact Message */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-4">
                      <Users className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          You&apos;ve Made a Difference
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          Every interaction, every moment you&apos;ve shared
                          with our community has contributed to making this
                          platform a better place. Your presence has been
                          valued, and your absence will be felt.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Note */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                        Before You Go...
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
                        Sometimes the most beautiful journey is the one that
                        leads you back to yourself. Whatever path you choose,
                        remember that growth often comes disguised as an
                        ending.&quot;
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        - Our team&apos;s heartfelt message to you
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning Section */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">
                        What happens when you delete your account?
                      </h3>
                      <ul className="space-y-2 text-red-800 dark:text-red-300">
                        <li className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          All your personal data will be permanently removed
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Your profile and content will be deleted forever
                        </li>
                        <li className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          You&apos;ll lose access to all premium features
                        </li>
                        <li className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          This action cannot be undone
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Keep My Account
                  </button>
                  <button
                    onClick={() => setIsConfirming(true)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg"
                  >
                    <Trash2 className="w-5 h-5" />I Still Want to Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Confirmation Section */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Final Confirmation Required
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    To proceed with account deletion, please type{" "}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      delete my account
                    </span>{" "}
                    in the field below:
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <input
                      type="text"
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      placeholder="Type: delete my account"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent outline-none transition duration-200"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setIsConfirming(false)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Go Back
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={!isConfirmationValid || isLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deleting Account...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5" />
                          Permanently Delete Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-8 text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            Need help with something else?{" "}
            <button
              onClick={handleCancel}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact our support team
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletePage;
