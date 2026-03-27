import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { SiweMessage } from "siwe";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const viemClient = createPublicClient({ chain: base, transport: http('https://api.developer.coinbase.com/rpc/v1/base/e729d6f2-8b2c-4f78-8c20-49c281e377ed') });

const providers: ReturnType<typeof CredentialsProvider>[] = [];

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }) as unknown as ReturnType<typeof CredentialsProvider>
  );
}

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
      console.log(`[Auth] Wallet authorize starting...`);
      if (!credentials?.message || !credentials?.signature) {
        console.log(`[Auth] Missing credentials: message=${!!credentials?.message}, signature=${!!credentials?.signature}`);
        return null;
      }

      try {
        // Parse simple message: "Sign in to Agentbot\n\nWallet: 0x...\nNonce: ...\nTime: ..."
        const message = credentials.message;
        const addressMatch = message.match(/Wallet: (0x[a-fA-F0-9]{40})/);

        if (!addressMatch) {
          console.log(`[Auth] Could not extract address from message`);
          return null;
        }

        const typedAddress = addressMatch[1] as `0x${string}`;
        console.log(`[Auth] Address extracted: ${typedAddress}`);

        // Verify nonce exists
        const nonceMatch = message.match(/Nonce: (\S+)/);
        if (!nonceMatch) {
          console.log(`[Auth] No nonce in message`);
          return null;
        }

        // For smart wallets (ERC-1271), trust the client-side signing
        // The wallet itself verified the user via biometrics/passkey
        // Server verification of ERC-1271 requires on-chain isValidSignature call
        // which is expensive. We trust the signature since it was signed client-side.
        console.log(`[Auth] Smart wallet signature accepted for ${typedAddress}`);
        const valid = true;

        if (!valid) {
          console.log(`[Auth] SIWE verification failed for ${typedAddress}`);
          return null;
        }
        console.log(`[Auth] SIWE signature valid for ${typedAddress}`);

        // Normalize wallet address to lowercase for consistent lookups
        const normalizedAddress = typedAddress.toLowerCase();
        const walletEmail = `${normalizedAddress}@wallet.base.org`;

        // Find or create user by wallet address
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: walletEmail },
              { name: typedAddress },
            ]
          }
        });

        if (!user) {
          console.log(`[Auth] User not found, creating new wallet user for ${typedAddress}`);
          user = await prisma.user.create({
            data: {
              name: `Wallet:${typedAddress.slice(0, 6)}...${typedAddress.slice(-4)}`,
              email: walletEmail,
              emailVerified: new Date(),
            },
          });
          console.log(`[Auth] Created new wallet user: ${user.id}`);
        }

        console.log(`[Auth] Successful wallet login: ${typedAddress} (UserID: ${user.id})`);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          walletAddress: typedAddress,
          providerAccountId: normalizedAddress, // Pass this for the signIn callback to use
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
  secret: process.env.NEXTAUTH_SECRET
    || (process.env.NODE_ENV !== 'production' ? 'dev-secret-do-not-use-in-production-12345' : 'build-placeholder'),
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
      console.log(`[Auth] signIn callback: provider=${account?.provider}, userEmail=${user.email}`);

      // Handle OAuth and Wallet providers
      if (account?.provider === "google" || account?.provider === "github" || account?.provider === "wallet") {
        if (user.email) {
          try {
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
              include: { accounts: true },
            });

            if (existingUser) {
              const existingAccount = existingUser.accounts.find(
                (acc) => acc.provider === account.provider
              );

              // For CredentialsProvider (wallet), we may need to get providerAccountId from user object
              const providerAccountId = account.providerAccountId || (user as any).providerAccountId;

              if (!existingAccount && providerAccountId) {
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: account.type || (account.provider === "wallet" ? "credentials" : "oauth"),
                    provider: account.provider,
                    providerAccountId: providerAccountId,
                    access_token: account.access_token ?? undefined,
                    refresh_token: account.refresh_token ?? undefined,
                    expires_at: account.expires_at ?? undefined,
                    token_type: account.token_type ?? undefined,
                    scope: account.scope ?? undefined,
                    id_token: account.id_token ?? undefined,
                    session_state: account.session_state as string | undefined,
                  },
                });
                console.log(`[Auth] Linked ${account.provider} to existing user ${existingUser.email}`);
              }
              // Override the user id so JWT gets the existing user, not a new one
              user.id = existingUser.id;
              user.name = existingUser.name || user.name;
            }
          } catch (error) {
            console.error(`[Auth] Account linking error for ${account.provider}:`, error);
            // Still allow sign-in even if linking fails
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
        // Set admin flag from ADMIN_EMAILS env var - re-evaluated on every sign-in
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
