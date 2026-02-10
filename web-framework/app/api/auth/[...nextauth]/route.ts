import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      const existing = await db.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );

      if (!existing.rows.length) {
        await db.query(
          `INSERT INTO users (name, email, password_hash, provider, provider_id)
           VALUES ($1, $2, '', $3, $4)`,
          [
            user.name,
            user.email,
            account?.provider,
            account?.providerAccountId,
          ]
        );
      }

      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
