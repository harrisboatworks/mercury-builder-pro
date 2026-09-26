// Accepts Deno URL zod and the app's npm zod without coupling their type identities.
export function createPaymentCustomerInfoSchema(z: any) {
  return z.object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().max(255).optional().or(z.literal("")).or(z.null()),
    phone: z.string().trim().min(7).max(25).regex(/^[0-9+().\s-]+$/)
      .refine((value: string) => value.replace(/\D/g, "").length >= 7, "Phone number must include at least 7 digits")
      .optional(),
    addressLine1: z.string().trim().max(120).optional().or(z.literal("")),
    addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    region: z.string().trim().max(80).optional().or(z.literal("")),
    postalCode: z.string().trim().max(16).optional().or(z.literal("")),
    country: z.string().trim().max(80).optional().or(z.literal("")),
  }).optional();
}
