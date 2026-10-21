import { StoryCategories } from "@/db/schema";
import z from "zod";

export const categoryRule = z.enum(StoryCategories)