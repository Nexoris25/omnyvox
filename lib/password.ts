import { z } from "zod";
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Include a capital letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^a-zA-Z0-9\s]/, "Include a special character");
