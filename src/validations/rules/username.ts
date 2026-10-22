import z from "zod";

export const usernameRule = z.string().trim().min(3).max(255).regex(/^[0-9a-zA-Z_]+$/)