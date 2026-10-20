"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthTokenProvider } from "@/lib/api/client";

/** Gives the central API client access to the Clerk session token. Renders nothing. */
export default function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenProvider(() => getToken());
    return () => setAuthTokenProvider(null);
  }, [getToken]);
  return null;
}
