import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { authUsers, authAccounts, authSessions, authVerificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  }),
  providers: [Google, GitHub],
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnSession = nextUrl.pathname.startsWith("/session");
      const isOnApi = nextUrl.pathname.startsWith("/api") && !nextUrl.pathname.startsWith("/api/auth");
      if (isOnDashboard || isOnSession || isOnApi) {
        return isLoggedIn;
      }
      return true;
    },
  },
});
