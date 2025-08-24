import { useEffect, useState, useCallback } from "react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import type { GoogleInitConfig } from "@/types/google"; // import shared types

interface GoogleSignInProps {
  mode: "login" | "register";
}

export function GoogleSignIn({}: GoogleSignInProps) {
  const { googleAuth, isLoading, error } = useAuth();
  const router = useRouter();
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // ✅ stable callback, no redeclaration every render
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        setIsProcessing(true);
        const googleToken = response.credential;

        await googleAuth({ idToken: googleToken });
        router.push("/dashboard");
      } catch (error) {
        console.error("Google auth failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [googleAuth, router]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID not found in environment variables");
      return;
    }

    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        } satisfies GoogleInitConfig);
        setIsGoogleReady(true);
      }
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogle();
        }
      }, 100);

      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }, [GOOGLE_CLIENT_ID, handleGoogleResponse]);

  const handleGoogleSignIn = () => {
    if (window.google && isGoogleReady) {
      window.google.accounts.id.prompt();
    } else {
      console.error("Google Sign-In not ready");
    }
  };

  const isButtonLoading = isLoading || isProcessing;

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="text-red-600 text-sm text-center">
        Google Sign-In not configured
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGoogleSignIn}
        disabled={isButtonLoading || !isGoogleReady}
        variant="secondary"
        className="w-full flex items-center justify-center gap-3 py-5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm rounded-lg disabled:opacity-50"
      >
        <FcGoogle className="h-5 w-5 lg:h-6 lg:w-6" />
        <span className="font-medium">
          {isButtonLoading
            ? "Connecting..."
            : !isGoogleReady
            ? "Loading Google..."
            : "Continue with Google"}
        </span>
      </Button>

      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
