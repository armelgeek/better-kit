
import { z } from "zod";
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
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
  database: new Database("./sqlite.db"),
   emailAndPassword: { 
    enabled: true, 
  },
  advanced:{
    cookiePrefix: 'next-todo',
  }
})

export type AuthSession = {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
};