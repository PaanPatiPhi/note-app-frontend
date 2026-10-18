"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getMe,
  logout as apiLogout,
  loginWithGoogle as apiLoginWithGoogle,
  loginWithLine as apiLoginWithLine,
  loginWithEmail as apiLoginWithEmail,
  registerWithEmail as apiRegisterWithEmail,
  linkGoogle as apiLinkGoogle,
  unlinkGoogle as apiUnlinkGoogle,
  linkLine as apiLinkLine,
  unlinkLine as apiUnlinkLine,
  uploadAvatar as apiUploadAvatar,
  updateProfile as apiUpdateProfile,
  setAuthToken,
} from "./api";
import type { User, UserIdentity } from "./types";

type AuthContextType = {
  user: User | null;
  identities: UserIdentity[];
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithLine: (idToken: string) => Promise<void>;
  linkGoogleAccount: (credential: string) => Promise<{ success: boolean; message: string }>;
  unlinkGoogleAccount: () => Promise<void>;
  linkLineAccount: (idToken: string) => Promise<{ success: boolean; message: string }>;
  unlinkLineAccount: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatar_url: string }>;
  updateProfile: (data: { display_name?: string; avatar_url?: string }) => Promise<void>;
  useLineAvatar: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
      setIdentities(data.identities || []);
    } catch {
      setUser(null);
      setIdentities([]);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiLoginWithEmail(email, password);
      setUser(res.user);
      setIdentities(res.identities || []);
      router.push("/chat");
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const res = await apiRegisterWithEmail(email, password, displayName);
      setUser(res.user);
      setIdentities(res.identities || []);
      router.push("/chat");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await apiLoginWithGoogle(credential);
      setUser(res.user);
      setIdentities(res.identities || []);
      router.push("/chat");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithLine = async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await apiLoginWithLine(idToken);
      setUser(res.user);
      setIdentities(res.identities || []);
      router.push("/chat");
    } finally {
      setIsLoading(false);
    }
  };

  const linkGoogleAccount = async (credential: string) => {
    const res = await apiLinkGoogle(credential);
    setIdentities(res.identities || []);
    await refreshUser();
    return { success: res.success, message: res.message };
  };

  const unlinkGoogleAccount = async () => {
    const res = await apiUnlinkGoogle();
    setIdentities(res.identities || []);
    await refreshUser();
  };

  const linkLineAccount = async (idToken: string) => {
    const res = await apiLinkLine(idToken);
    setIdentities(res.identities || []);
    await refreshUser();
    return { success: res.success, message: res.message };
  };

  const unlinkLineAccount = async () => {
    const res = await apiUnlinkLine();
    setIdentities(res.identities || []);
    await refreshUser();
  };

  const uploadAvatar = async (file: File) => {
    const res = await apiUploadAvatar(file);
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
    return { success: res.success, avatar_url: res.avatar_url };
  };

  const updateProfile = async (data: { display_name?: string; avatar_url?: string }) => {
    const res = await apiUpdateProfile(data);
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
  };

  const useLineAvatar = async () => {
    const lineIdent = identities.find((i) => i.provider === "line");
    if (!lineIdent?.avatar_url) {
      throw new Error("ไม่พบรูปโปรไฟล์จากบัญชี LINE");
    }
    await updateProfile({ avatar_url: lineIdent.avatar_url });
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setIdentities([]);
      setIsLoading(false);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        identities,
        isLoading,
        isAuthenticated: !!user,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithLine,
        linkGoogleAccount,
        unlinkGoogleAccount,
        linkLineAccount,
        unlinkLineAccount,
        uploadAvatar,
        updateProfile,
        useLineAvatar,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
