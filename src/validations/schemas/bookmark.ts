import z, { json, string } from "zod";
import { slugRule } from "../rules";

export const bookmarkSchema = z.object({
    slug: slugRule,
    variables: json(),
    nodeId: string().nonempty()
})