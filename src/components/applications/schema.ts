import { z } from "zod";

const phoneRegex = /^(\+1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

export const agentApplicationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(phoneRegex, "Please enter a valid US phone number (e.g., 702-555-1234)"),
  brokerageName: z
    .string()
    .min(2, "Brokerage name must be at least 2 characters")
    .max(200, "Brokerage name must be less than 200 characters"),
  brokerageAddress: z
    .string()
    .min(10, "Please enter a complete brokerage address")
    .max(300, "Address must be less than 300 characters"),
  brokeragePhone: z.string().regex(phoneRegex, "Please enter a valid brokerage phone number"),
  isActiveAgent: z.boolean(),
  licensedStates: z
    .array(z.string())
    .min(1, "Please select at least one licensed state"),
  licenseNumbers: z.record(z.string(), z.string().min(1, "License number is required")),
  yearsOfExperience: z
    .number()
    .min(0, "Years of experience cannot be negative")
    .max(50, "Please enter a valid number of years"),
});

export type AgentApplicationFormData = z.infer<typeof agentApplicationSchema>;
