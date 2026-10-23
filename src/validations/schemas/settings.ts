import z from "zod";
import { bioRule, emailRule, usernameRule } from "../rules";

export const settingsSchema = z.object({
    email: emailRule.optional(),
    username: usernameRule.optional(),
    bio: bioRule.optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field to update"
})