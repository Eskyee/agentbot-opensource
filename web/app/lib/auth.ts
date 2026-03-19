import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { SiweMessage } from "siwe";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const viemClient = createPublicClient({ chain: base, transport: http() });

const providers: ReturnType<typeof CredentialsProvider>[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }) as unknown as ReturnType<typeof CredentialsProvider>
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
    id: "wallet",
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
        const address = siweMessage.address as `0x${string}`;

        // Validate domain to prevent SIWE replay attacks from other sites
        const expectedDomain = process.env.NEXTAUTH_URL
          ? new URL(process.env.NEXTAUTH_URL).host
          : 'agentbot.raveculture.xyz';
        if (siweMessage.domain !== expectedDomain) {
          console.log(`[Auth] SIWE domain mismatch: ${siweMessage.domain} !== ${expectedDomain}`);
          return null;
        }

        // Use viem verifyMessage — handles ERC-6492 (pre-deployed Base smart wallets)
        const valid = await viemClient.verifyMessage({
          address,
          message: credentials.message,
          signature: credentials.signature as `0x${string}`,
        });

        if (!valid) {
          console.log(`[Auth] SIWE verification failed for ${address}`);
          return null;
        }

        // Normalize wallet address to lowercase for consistent lookups
        const normalizedAddress = address.toLowerCase();
        const walletEmail = `${normalizedAddress}@wallet.base.org`;

        // Find or create user by wallet address
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: walletEmail },
              { name: address },
            ]
          }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: `Wallet:${address.slice(0, 6)}...${address.slice(-4)}`,
              email: walletEmail,
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
    maxAge: 24 * 60 * 60, // 24 hours - reduced from 30 days for security
  },
  secret: process.env.NEXTAUTH_SECRET,
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true },
          });
          if (existingUser) {
            const existingAccount = existingUser.accounts.find(
              (acc) => acc.provider === account.provider
            );
            if (!existingAccount && account.providerAccountId) {
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
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        // Set admin flag from ADMIN_EMAILS env var — re-evaluated on every sign-in
        const adminEmails = (process.env.ADMIN_EMAILS || '')
          .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        token.isAdmin = adminEmails.includes((user.email || '').toLowerCase());
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
        session.user.email = token.email;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      console.log(`[Auth] User ${user.email} signed in via ${account?.provider || 'credentials'}`);
    },
    async signOut({ token }) {
      console.log(`[Auth] User ${token?.email} signed out`);
    },
  },
};
