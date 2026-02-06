import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config';
import prisma from '../config/database';

// Extend express User type
declare global {
    namespace Express {
        interface User {
            id: string;
            googleId: string;
            email: string;
            name: string;
            avatar: string | null;
        }
    }
}

export function initializePassport() {
    // Serialize user ID to session
    passport.serializeUser((user: Express.User, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
            });
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.googleClientId,
                clientSecret: config.googleClientSecret,
                callbackURL: `${config.backendUrl}/api/auth/google/callback`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Find or create user
                    let user = await prisma.user.findUnique({
                        where: { googleId: profile.id },
                    });

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                googleId: profile.id,
                                email: profile.emails?.[0]?.value || '',
                                name: profile.displayName,
                                avatar: profile.photos?.[0]?.value || null,
                            },
                        });
                        console.log(`👤 Created new user: ${user.email}`);
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );

    console.log('🔐 Passport initialized with Google OAuth');
}

export default passport;
