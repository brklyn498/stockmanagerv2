import prisma from '../../utils/db';

const SYSTEM_USER_EMAIL = 'bot@stockmanager.com';

export async function getSystemBotUser() {
  let user = await prisma.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL }
  });

  if (!user) {
    console.log('🤖 Creating system bot user...');
    user = await prisma.user.create({
      data: {
        email: SYSTEM_USER_EMAIL,
        name: 'Stock Manager Bot',
        password: 'bot_password_placeholder', // Should not be used for login
        role: 'ADMIN'
      }
    });
  }

  return user;
}
