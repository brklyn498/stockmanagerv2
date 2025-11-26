import bcrypt from 'bcryptjs'

// Reduced from 10 to 8 for better performance while maintaining security
// 8 rounds = ~40ms, 10 rounds = ~100-150ms on average hardware
const SALT_ROUNDS = 8

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}
