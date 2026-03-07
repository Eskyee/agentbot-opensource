import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { SiweMessage } from "siwe";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "email@example.com" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials) return null;
      console.log(`[Auth] Attempting credentials login for: ${credentials.email}`);
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });
      if (!user) {
        console.log(`[Auth] User not found: ${credentials.email}`);
        return null;
      }
      if (!user.password) {
        console.log(`[Auth] User has no password (likely OAuth-only): ${credentials.email}`);
        return null;
      }
      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (isValid) {
        console.log(`[Auth] Successful credentials login: ${credentials.email}`);
        return { id: user.id, name: user.name, email: user.email };
      }
      console.log(`[Auth] Invalid password for: ${credentials.email}`);
      return null;
    },
  })
);

// Wallet (SIWE - Sign-In with Ethereum) login
providers.push(
  CredentialsProvider({
    name: "Ethereum Wallet",
    credentials: {
      message: { label: "Message", type: "text" },
      signature: { label: "Signature", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.message || !credentials?.signature) {
        return null;
      }

      try {
        const siweMessage = new SiweMessage(credentials.message);
        // @ts-ignore - SIWE verify types
        const fields = await siweMessage.verify(credentials.signature);

        if (!fields.success) {
          console.log(`[Auth] SIWE verification failed`);
          return null;
        }

        const address = fields.data.address;
        const domain = fields.data.domain;

        // Find or create user by wallet address
        let user = await prisma.user.findFirst({
          where: { 
            OR: [
              { name: address },
              { email: `${address.toLowerCase()}@wallet.base.org` }
            ]
          }
        });

        if (!user) {
          // Create new user with wallet address as identifier
          user = await prisma.user.create({
            data: {
              name: `Wallet:${address.slice(0, 6)}...${address.slice(-4)}`,
              email: `${address.toLowerCase()}@wallet.base.org`,
              emailVerified: new Date(),
            },
          });
          console.log(`[Auth] Created new wallet user: ${user.id}`);
        }

        console.log(`[Auth] Successful wallet login: ${address}`);
        return { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          walletAddress: address 
        };
      } catch (error) {
        console.error(`[Auth] SIWE error:`, error);
        return null;
      }
    },
  })
);

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'default-dev-secret',
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
    verifyRequest: "/verify-request",
    newUser: "/onboard",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers (GitHub, Google), allow sign in
      if (account?.provider === "github" || account?.provider === "google") {
        // Check if user exists in database
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });
          
          // If user exists but doesn't have this OAuth account linked, link it
          if (existingUser) {
            const existingAccount = existingUser.accounts.find(
              (acc) => acc.provider === account.provider
            );
            
            if (!existingAccount && account.providerAccountId) {
              // Create the account link
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
            }
          }
        }
        return true;
      }
      // For credentials provider, allow sign in (authorization already done in provider)
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in - persist user id to token
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      // On subsequent calls, token already has the data
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
        session.user.email = token.email;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign ins for debugging
      console.log(`[Auth] User ${user.email} signed in via ${account?.provider || 'credentials'}`);
    },
    async signOut({ token }) {
      console.log(`[Auth] User ${token?.email} signed out`);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
