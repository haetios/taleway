import z from "zod";
import { categoryRule, titleRule, blurbRule, statusRule, graphRule, coverRule } from "../rules";

export const editStorySchema = z.object({
    title: titleRule.optional(),
    blurb: blurbRule.optional(),
    category: categoryRule.optional(),
    graph: graphRule.optional(),
    status: statusRule.optional(),
    coverUrl: coverRule.optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field to update"
})

export type EditStorySchema = z.infer<typeof editStorySchema>