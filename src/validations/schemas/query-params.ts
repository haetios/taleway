import { StoryCategories } from "@/db/schema";
import z from "zod";

// Query params : strings brutes → transform en tableaux pour inArray
// ?categories=romance,horror  ?authors=<uuid>,<uuid>
export const queryParamSchema = z.object({
    title: z.string().optional(),
    categories: z.string()
        .transform(s => s.split(','))
        .pipe(z.array(z.enum(StoryCategories)))
        .optional(),
    authors: z.string()
        .transform(s => s.split(','))
        .pipe(z.array(z.uuid()))
        .optional()
})