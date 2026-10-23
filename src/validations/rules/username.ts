import z from "zod";

export const usernameRule = z.string().trim()
    .min(3, { error: "The username must have at least 3 characters" })
    .max(255, { error: "The username must have less than 255 characters" })
    .regex(/^[0-9a-zA-Z_]+$/, { error: "The username only accepts numbers, letters and underscore" })