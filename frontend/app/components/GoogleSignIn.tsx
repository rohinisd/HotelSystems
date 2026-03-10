"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Props = {
  onSuccess?: () => void;
  onError?: (err: string) => void;
  text?: "signin" | "signup_with" | "continue_with" | "signin_with";
};

export function GoogleSignIn({ onSuccess, onError, text = "continue_with" }: Props) {
  const handleSuccess = async (res: CredentialResponse) => {
    if (!res.credential) {
      onError?.("No credential returned");
      return;
    }
    try {
      const r = await fetch(`${API_URL}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: res.credential }),
      });
      const data = await r.json();
      if (!r.ok) {
        onError?.(data.detail || "Google sign-in failed");
        return;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.access_token);
      }
      onSuccess?.();
    } catch {
      onError?.("Network error. Is the API running?");
    }
  };

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError?.("Google sign-in was cancelled or failed")}
      useOneTap={false}
      theme="outline"
      size="large"
      text={text}
      shape="rectangular"
    />
  );
}
