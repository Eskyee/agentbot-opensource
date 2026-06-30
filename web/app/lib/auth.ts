import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { SiweMessage } from 'siwe';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { consumeWalletNonce } from '@/app/lib/wallet-nonce';
import { isAdminEmail } from '@/app/lib/admin';

const VercelProvider = {
  id: 'vercel',
  name: 'Vercel',
  type: 'oauth' as const,
  authorization: {
    url: 'https://vercel.com/oauth/authorize',
    params: {
      response_type: 'code',
      scope: 'openid email profile offline_access',
    },
  },
  token: {
    url: 'https://api.vercel.com/v2/oauth/access_token',
    async request(ctx: any) {
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID!,
        client_secret: process.env.VERCEL_APP_CLIENT_SECRET!,
        code: ctx.params.code,
        grant_type: 'authorization_code',
        redirect_uri: ctx.provider.callbackUrl,
      });
      const res = await fetch('https://api.vercel.com/v2/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          `Vercel token exchange failed (${res.status}): ${
            data?.error_description || data?.error || 'unknown error'
          }`
        );
      }
      return { tokens: data };
    },
  },
  userinfo: {
    url: 'https://api.vercel.com/v2/user',
  },
  // NextAuth v4 expects `checks` as an array of strings, not an object.
  // Vercel's integration OAuth does not support PKCE, so we use `state` only.
  checks: ['state'] as const,
  profile(profile: any) {
    return {
      id: profile.user?.id || profile.id,
      name: profile.user?.name || profile.name,
      email: profile.user?.email || profile.email,
      image: profile.user?.avatar || profile.avatar,
    };
  },
  clientId: process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID,
  clientSecret: process.env.VERCEL_APP_CLIENT_SECRET,
};

function getNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;

  // Only fall back to the placeholder during a genuine build step (compiling
  // pages, no requests served). VERCEL_ENV / CI persist at runtime on a live
  // preview deployment, so they must NOT relax the secret requirement there —
  // otherwise previews would serve real traffic signing session JWTs with a
  // public, hardcoded value (forgeable sessions, account impersonation).
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
  if (isBuildTime) {
    return 'build-placeholder';
  }

  // Any environment that actually serves requests must have a real secret.
  throw new Error('NEXTAUTH_SECRET must be set');
}

// NOTE: COINBASE_RPC_URL / COINBASE_API_KEY are treated as the RPC *path id*
// appended to the Coinbase Developer Platform base URL, not a full URL.
const coinbaseRpcUrl =
  process.env.COINBASE_RPC_URL || process.env.COINBASE_API_KEY
    ? `https://api.developer.coinbase.com/rpc/v1/base/${
        process.env.COINBASE_RPC_URL || process.env.COINBASE_API_KEY
      }`
    : undefined;
const viemClient = coinbaseRpcUrl
  ? createPublicClient({ chain: base, transport: http(coinbaseRpcUrl) })
  : createPublicClient({ chain: base, transport: http() });

// Pre-computed bcrypt hash used to equalize response time on the
// user-not-found / no-password paths, so an attacker cannot enumerate which
// emails have accounts by measuring login latency.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equalizer-not-a-secret', 10);

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
      allowDangerousEmailAccountLinking: true,
    }) as unknown as ReturnType<typeof CredentialsProvider>
  );
}

providers.push(
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials) return null;
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      // Always run a bcrypt compare so the response time does not reveal
      // whether the email exists or has a password set (user enumeration).
      const hashToCompare = user?.password || DUMMY_PASSWORD_HASH;
      const passwordMatches = await bcrypt.compare(credentials.password, hashToCompare);

      if (user?.password && passwordMatches) {
        console.log(`[Auth] Successful credentials login: ${user.email}`);
        return { id: user.id, name: user.name, email: user.email };
      }
      return null;
    },
  })
);

// Wallet (SIWE - Sign-In with Ethereum) login
providers.push(
  CredentialsProvider({
    id: 'wallet',
    name: 'Ethereum Wallet',
    credentials: {
      message: { label: 'Message', type: 'text' },
      signature: { label: 'Signature', type: 'text' },
    },
    async authorize(credentials) {
      console.log(`[Auth] Wallet authorize starting...`);
      if (!credentials?.message || !credentials?.signature) {
        console.log(
          `[Auth] Missing credentials: message=${!!credentials?.message}, signature=${!!credentials?.signature}`
        );
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

        const nonceOk = await consumeWalletNonce(nonceMatch[1]);
        if (!nonceOk) {
          console.log(`[Auth] Nonce invalid or already used`);
          return null;
        }

        // Verify the signature matches the claimed address using viem
        try {
          const { verifyMessage } = await import('viem');
          const valid = await verifyMessage({
            address: typedAddress,
            message,
            signature: credentials.signature as `0x${string}`,
          });
          if (!valid) {
            console.log(`[Auth] SIWE verification failed for ${typedAddress}`);
            return null;
          }
          console.log(`[Auth] SIWE signature valid for ${typedAddress}`);
        } catch (verifyError) {
          console.error(`[Auth] SIWE verification error:`, verifyError);
          return null;
        }

        // Normalize wallet address to lowercase for consistent lookups
        const normalizedAddress = typedAddress.toLowerCase();
        const walletEmail = `${normalizedAddress}@wallet.base.org`;

        // Find or create user by wallet address
        let user = await prisma.user.findFirst({
          where: {
            OR: [{ email: walletEmail }, { name: typedAddress }],
          },
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: getNextAuthSecret(),
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    verifyRequest: '/verify-request',
    newUser: '/onboard',
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-next-auth.session-token`
          : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Secure-next-auth.callback-url`
          : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? `__Host-next-auth.csrf-token`
          : `next-auth.csrf-token`,
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
      console.log(`[Auth] signIn callback: provider=${account?.provider}`);

      // Handle OAuth and Wallet providers
      if (
        account?.provider === 'google' ||
        account?.provider === 'github' ||
        account?.provider === 'vercel' ||
        account?.provider === 'wallet'
      ) {
        // Only reconcile/link to an existing account by email when the email
        // is provably verified. Linking by an unverified email is an account
        // takeover primitive (attacker registers a victim's email at an OAuth
        // provider, then inherits the victim's account).
        // - wallet: synthetic email is bound to a verified signature
        // - google: provider returns email_verified
        // - github: NextAuth uses the account's primary *verified* email
        // - vercel: no verification signal exposed → never auto-links
        const emailVerified =
          account.provider === 'wallet' ||
          account.provider === 'github' ||
          (profile as any)?.email_verified === true;

        if (user.email && emailVerified) {
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
              const providerAccountId =
                account.providerAccountId || (user as any).providerAccountId;

              if (!existingAccount && providerAccountId) {
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: account.type || (account.provider === 'wallet' ? 'credentials' : 'oauth'),
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
                console.log(
                  `[Auth] Linked ${account.provider} to existing user ${existingUser.email}`
                );
              }
              // Override the user id so JWT gets the existing user, not a new one
              user.id = existingUser.id;
              user.name = existingUser.name || user.name;
              user.email = existingUser.email; // Ensure email is from DB
            }
          } catch (error) {
            console.error(`[Auth] Account linking error for ${account.provider}:`, error);
            // DO NOT throw error, let NextAuth continue
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
        token.isAdmin = isAdminEmail(user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || '';
        session.user.email = token.email;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(
        `[Auth] User ${user.email} signed in via ${
          account?.provider || 'credentials'
        } (new=${isNewUser})`
      );
      if (isNewUser && user.email) {
        try {
          const { sendWelcomeEmail } = await import('@/app/lib/email');
          const name = user.name || user.email.split('@')[0];
          await sendWelcomeEmail(user.email, name);
          console.log(`[Auth] Welcome email sent to ${user.email}`);
        } catch (err) {
          console.error(`[Auth] Failed to send welcome email:`, err);
        }
      }
    },
    async signOut({ token }) {
      console.log(`[Auth] User ${token?.email} signed out`);
    },
  },
};
