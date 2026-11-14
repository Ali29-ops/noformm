import { z } from "zod";
import { governorateIds } from "./egypt";

export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Phone number is too short.")
  .max(20, "Phone number is too long.")
  .regex(/^[+\d][\d\s\-()]+$/, "Phone number looks invalid.");

export const emailSchema = z.string().trim().toLowerCase().email("Email looks invalid.").max(160);

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  phone: phoneSchema,
  phone2: z.string().trim().max(20).optional().default(""),
  country: z.string().trim().default("EG"),
  governorate: z.enum(governorateIds as [string, ...string[]], { message: "Choose a governorate." }),
  city: z.string().trim().min(2, "City is required.").max(120),
  area: z.string().trim().max(120).optional().default(""),
  street: z.string().trim().min(3, "Street is required.").max(200),
  building: z.string().trim().max(40).optional().default(""),
  floor: z.string().trim().max(20).optional().default(""),
  apartment: z.string().trim().max(20).optional().default(""),
  landmark: z.string().trim().max(200).optional().default(""),
});

export type AddressForm = z.infer<typeof addressSchema>;

export const checkoutSchema = addressSchema.extend({
  email: emailSchema,
  notes: z.string().trim().max(1000).optional().default(""),
  paymentMethod: z.enum(["bank_transfer", "card"]),
  coupon: z.string().trim().max(40).optional().default(""),
  saveAddress: z.boolean().optional().default(false),
  acceptTerms: z.literal(true, { message: "Please accept the terms." }),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  phone: z.string().trim().max(20).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  email: emailSchema,
  phone: phoneSchema,
  collection: z.string().trim().max(40).optional().default(""),
  piece: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(5, "Message is too short.").max(3000),
  website: z.string().max(0).optional().default(""), // honeypot
});

export function formToObject(formData: FormData) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form.";
}
