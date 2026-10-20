import z from "zod";

export const emailRule = z.email().trim().max(255)