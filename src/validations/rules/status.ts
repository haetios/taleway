import { StoryStatus } from "@/db/schema";
import z from "zod";

export const statusRule = z.enum(StoryStatus)