import z from "zod";

export const usernameRule = z.string().trim().max(255).min(1).regex(/^[0-9a-zA-Z_\ ]+$/)