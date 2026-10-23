import z from "zod";

export const emailRule = z.email().trim().max(255, { error: "The email can't have more than 255 characters" })