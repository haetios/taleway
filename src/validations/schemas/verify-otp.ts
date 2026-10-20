import { z } from "zod"
import { emailRule } from "@/validations/rules/email"

export const verifyOtpSchema = z.object({
  email: emailRule,
  token: z.string().regex(/^\d{6}$/),
})

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>