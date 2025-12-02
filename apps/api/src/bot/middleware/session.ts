import { Context, Middleware } from 'telegraf';
import prisma from '../../utils/db.ts';
import type { BotContext, SessionData } from '../types.ts';

export function prismaSession(): Middleware<BotContext> {
  return async (ctx, next) => {
    // Only handle updates with a chat/user
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      // Create a dummy session for types to be happy if no user
      ctx.session = { cursor: 0 };
      return next();
    }

    // Load session from DB
    let session: SessionData = { cursor: 0 }; // Default session
    try {
      const dbSession = await prisma.botSession.findUnique({
        where: { telegramId: BigInt(telegramId) }
      });

      if (dbSession && dbSession.data) {
        // Check expiry
        if (dbSession.expiresAt > new Date()) {
          const parsed = JSON.parse(dbSession.data);
          session = { ...session, ...parsed };
        } else {
          // Clean up expired session
          await prisma.botSession.delete({
            where: { telegramId: BigInt(telegramId) }
          });
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }

    // Attach to context
    ctx.session = session;

    // Run next middleware (the actual bot logic)
    await next();

    // Save session back to DB
    try {
      if (ctx.session) {
        // Clean up empty sessions logic (optional)

        const data = JSON.stringify(ctx.session);
        // Expiry: 24 hours from now
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.botSession.upsert({
          where: { telegramId: BigInt(telegramId) },
          create: {
            telegramId: BigInt(telegramId),
            data,
            expiresAt
          },
          update: {
            data,
            expiresAt
          }
        });
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };
}
