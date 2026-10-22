import { StoryCategories } from "@/db/schema";
import z from "zod";

export const queryParamSchema = z.object({
    title: z.string().optional(),
    categories: z.array(z.enum(StoryCategories)).optional(),
    authors: z.array(z.uuid()).optional()
})