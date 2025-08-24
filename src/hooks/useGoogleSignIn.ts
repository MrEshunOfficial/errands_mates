import { useEffect, useState, useCallback } from "react";
import type { GoogleInitConfig, GoogleButtonConfig } from "@/types/google";

interface GoogleSignInConfig {
  clientId: string;
  onSuccess: (credentialResponse: { credential: string }) => void;
  onError?: () => void;
}

export const useGoogleSignIn = ({
  clientId,
  onSuccess,
  onError,
}: GoogleSignInConfig) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      try {
        onSuccess(response);
      } catch {
        onError?.();
      }
    },
    [onSuccess, onError]
  );

  const initializeGoogleSignIn = useCallback(() => {
    try {
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      } satisfies GoogleInitConfig);
      setIsLoaded(true);
    } catch {
      setError("Failed to initialize Google Sign-In");
    }
  }, [clientId, handleCredentialResponse]);

  useEffect(() => {
    if (window.google) {
      initializeGoogleSignIn();
      return;
    }

    const checkGoogleLoaded = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogleLoaded);
        initializeGoogleSignIn();
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkGoogleLoaded);
      setError("Failed to load Google Sign-In SDK");
    }, 10000);

    return () => {
      clearInterval(checkGoogleLoaded);
      clearTimeout(timeout);
    };
  }, [initializeGoogleSignIn]);

  const signIn = () => {
    if (!isLoaded || !window.google) {
      setError("Google Sign-In not ready");
      return;
    }

    try {
      window.google.accounts.id.prompt();
    } catch {
      setError("Failed to show Google Sign-In prompt");
      onError?.();
    }
  };

  const renderButton = (element: HTMLElement, config?: GoogleButtonConfig) => {
  if (!isLoaded || !window.google) {
    setError("Google Sign-In not ready");
    return;
  }

  try {
    window.google.accounts.id.renderButton(element, {
      theme: "outline",
      size: "large",
      width: element.offsetWidth,
      ...config,
    });
  } catch {
    setError("Failed to render Google Sign-In button");
  }
};


  return {
    isLoaded,
    error,
    signIn,
    renderButton,
  };
};
