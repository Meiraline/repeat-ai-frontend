import { z } from 'zod';
export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  currency: z.literal('RUB'),
  period: z.string(),
  trialDays: z.number().int().nonnegative(),
  credits: z.number().int().nonnegative(),
  features: z.array(z.string()),
  available: z.boolean(),
});
export const checkoutSchema = z.object({
  id: z.string(),
  status: z.enum(['processing', 'succeeded', 'failed', 'cancelled']),
});
export const billingSchema = z.object({
  plans: z.array(planSchema),
  version: z.number().int().positive(),
  trialUsed: z.boolean(),
  subscription: z.object({
    planId: z.string(),
    status: z.enum(['free', 'trialing', 'active', 'cancel_at_period_end']),
    periodEnd: z.string().datetime().nullable(),
    autoRenew: z.boolean(),
  }),
  credits: z.object({ balance: z.number().nonnegative(), limit: z.number().positive() }),
  checkout: checkoutSchema.nullable(),
});
export type Billing = z.infer<typeof billingSchema>;
export type BillingPlan = z.infer<typeof planSchema>;
