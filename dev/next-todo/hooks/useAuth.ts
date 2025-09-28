"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import type { User } from "@/lib/auth";

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        setState({
          user: session?.user || null,
          session: session?.session || null,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          user: null,
          session: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      
      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error.message || "Sign in failed" 
        }));
        return { success: false, error: result.error.message };
      }
      
      setState({
        user: result.data?.user || null,
        session: result.data?.session || null,
        isLoading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sign in failed";
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });
      
      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error.message || "Sign up failed" 
        }));
        return { success: false, error: result.error.message };
      }
      
      setState({
        user: result.data?.user || null,
        session: result.data?.session || null,
        isLoading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sign up failed";
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authClient.signOut();
      setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sign out failed";
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!state.user,
  };
}