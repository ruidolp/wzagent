import { z } from 'zod'

export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')

export const emailSchema = z.string().email('Invalid email format')

export const tenantSlugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

export function validatePhoneNumber(phone: string): boolean {
  return phoneNumberSchema.safeParse(phone).success
}

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function validateTenantSlug(slug: string): boolean {
  return tenantSlugSchema.safeParse(slug).success
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
