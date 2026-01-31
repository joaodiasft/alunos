import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function toPhoneDigits(phone: string) {
  return phone.replace(/\D/g, "")
}
