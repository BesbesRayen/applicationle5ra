import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import pool from '@/lib/db.js';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);

const authOptions: NextAuthOptions = {
  providers: hasGoogleOAuth
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
          authorization: {
            params: {
              prompt: 'select_account',
            },
          },
        }),
      ]
    : [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google') {
        let connection;
        try {
          connection = await pool.getConnection();

          // Check if user exists
          const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [user.email]
          ) as any;

          if ((existingUsers as any[]).length === 0) {
            // Create new user from Google profile
            const firstName = profile?.given_name || user.name?.split(' ')[0] || 'User';
            const lastName = profile?.family_name || user.name?.split(' ')[1] || '';
            const randomPassword = Math.random().toString(36).substring(2, 10);

            await connection.execute(
              'INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)',
              [firstName, lastName, user.email, '', randomPassword]
            );

            console.log('✅ New user created via Google OAuth:', user.email);
          } else {
            console.log('✅ Existing user logged in via Google OAuth:', user.email);
          }

          return true;
        } catch (error) {
          console.error('❌ Google sign-in error:', error);
          return false;
        } finally {
          if (connection) await connection.release();
        }
      }
      return true;
    },

    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.image = token.image;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-only-secret-change-me',
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
