import { betterAuth } from "better-auth";
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

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    url: "todos.db", // Same database as the todos
  },
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Simplified for demo
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      }
    }
  },
  socialProviders: {
    // You can add social providers here if needed
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID || "",
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    // }
  },
});

export type AuthSession = typeof auth.$Infer.Session;