import z from "zod";

export const slugRule = z.string()
                            .trim()
                            .max(255)
                            .regex(
                                /^[a-z0-9]+(?:-[a-z0-9]+)*-[2-9a-hjkmnp-z]{6}$/,
                                "Invalid slug"
                            )