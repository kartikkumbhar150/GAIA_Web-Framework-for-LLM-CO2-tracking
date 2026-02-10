/// <reference types="next" />
/// <reference types="next/types/global" />

declare namespace NodeJS {
  interface ProcessEnv {
    // App
    NODE_ENV: "development" | "production" | "test";

    // Database
    DATABASE_URL: string;

    // JWT
    JWT_SECRET: string;

    // NextAuth
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;

    // Google OAuth
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;

    // GitHub OAuth (optional)
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
  }
}
