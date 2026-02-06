import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Sync user with backend
            try {
                const response = await fetch(`${process.env.BACKEND_URL}/api/auth/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        googleId: account?.providerAccountId,
                        email: user.email,
                        name: user.name,
                        avatar: user.image,
                    }),
                });

                if (!response.ok) {
                    console.error('Failed to sync user with backend');
                }
            } catch (error) {
                console.error('Backend sync error:', error);
            }
            return true;
        },
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
                token.googleId = account.providerAccountId;
            }
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).googleId = token.googleId;
                (session.user as any).id = token.userId;
            }
            return session;
        },
    },
    pages: {
        signIn: '/',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
