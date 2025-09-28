// Mock Better Auth implementation for demonstration
// In a real project, you would install better-auth: npm install better-auth
import { z } from "zod";

// Extended user schema with role
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "user"]).default("user"),
  emailVerified: z.boolean().default(false),
  image: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// Mock Better Auth configuration
// In a real project, this would use the actual better-auth package
export const auth = {
  // Mock handler for Next.js API routes
  handler: {
    GET: async (request: Request) => {
      return new Response(JSON.stringify({ message: "Better Auth mock endpoint" }), {
        headers: { "Content-Type": "application/json" },
      });
    },
    POST: async (request: Request) => {
      return new Response(JSON.stringify({ message: "Better Auth mock endpoint" }), {
        headers: { "Content-Type": "application/json" },
      });
    },
  },
  
  // Mock API methods
  api: {
    getCurrentSession: async (context: any) => {
      // In a real implementation, this would validate sessions
      return null;
    },
  },
  
  // Mock configuration for demonstration
  database: {
    provider: "sqlite" as const,
    url: "todos.db",
  },
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string" as const,
        required: false,
        defaultValue: "user",
      }
    }
  },
};

export type AuthSession = {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
};