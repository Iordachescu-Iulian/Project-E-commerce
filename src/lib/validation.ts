import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address.')
  .transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password is too long.'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Recipient name is required.').max(120),
  phone: z.string().trim().min(6, 'Phone number is required.').max(30),
  line1: z.string().trim().min(3, 'Street address is required.').max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, 'City is required.').max(80),
  county: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().min(3, 'Postal code is required.').max(20),
  country: z.string().trim().min(2).max(80).default('Romania'),
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = addressSchema.partial();
