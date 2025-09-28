// Mock Better Auth client for demonstration
// In a real project, you would use: import { createAuthClient } from "better-auth/react";
import type { auth, User } from "@/lib/auth";

// Mock auth client implementation
export const authClient = {
  // Mock session management
  getSession: async () => {
    // In a real implementation, this would check browser storage/cookies
    return null as { user: User; session: any } | null;
  },

  // Mock sign in
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      // Mock implementation - in real app this would validate credentials
      console.log("Mock sign in:", email);
      return {
        data: null,
        error: { message: "Mock implementation - sign in not functional" },
      };
    },
  },

  // Mock sign up
  signUp: {
    email: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      // Mock implementation - in real app this would create user
      console.log("Mock sign up:", email, name);
      return {
        data: null,
        error: { message: "Mock implementation - sign up not functional" },
      };
    },
  },

  // Mock sign out
  signOut: async () => {
    console.log("Mock sign out");
    return { success: true };
  },
};

export type AuthClient = typeof authClient;