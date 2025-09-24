import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models';
import logger from './logger';

export const configurePassport = (): void => {
  // JWT Strategy
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_ACCESS_SECRET || 'fallback-secret'
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await (User.findById as any)(payload.sub).select('-password').exec();
        
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        logger.error('Passport JWT Strategy error:', error);
        return done(error, false);
      }
    })
  );

  // Serialize user for session (if using sessions)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session (if using sessions)
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await (User.findById as any)(id).select('-password').exec();
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};