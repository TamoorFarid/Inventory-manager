import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const companySchema = z.object({
  name: z.string().min(2, 'Company name is required.').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const memberSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters.')
    .max(80),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[0-9]/, 'Password must include a number.')
    .regex(/[^A-Za-z0-9]/, 'Password must include a special character.'),
});

export const inventorySchema = z.object({
  title: z.string().min(2, 'Product title is required.').max(160),
  description: z.string().max(500).optional().or(z.literal('')),
  kwPv: z.string().max(80).optional().or(z.literal('')),
  ipRating: z.string().max(80).optional().or(z.literal('')),
  warranty: z.string().max(80).optional().or(z.literal('')),
  maxSellingPrice: z.coerce.number().positive('Enter a valid end user price.'),
  minSellingPrice: z.coerce.number().positive('Enter a valid installer price.'),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative.'),
}).refine((values) => values.maxSellingPrice >= values.minSellingPrice, {
  message: 'End user price must be greater than or equal to installer price.',
  path: ['maxSellingPrice'],
});

export const saleSchema = z.object({
  inventoryItemId: z.string().uuid('Select a product.'),
  customerName: z.string().min(2, 'Customer name is required.').max(160),
  quantitySold: z.coerce.number().int().positive('Quantity must be at least 1.'),
  sellingPricePerUnit: z.coerce
    .number()
    .positive('Selling price must be greater than 0.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type CompanyValues = z.infer<typeof companySchema>;
export type MemberValues = z.infer<typeof memberSchema>;
export type InventoryValues = z.infer<typeof inventorySchema>;
export type SaleValues = z.infer<typeof saleSchema>;
