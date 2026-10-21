import z from "zod";

export const blurbRule = z.string().min(1)