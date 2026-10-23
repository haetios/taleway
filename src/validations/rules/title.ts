import z from "zod";

export const titleRule = z.string().trim()
    .max(248, { error: "The title must have less than 248 characters" }) // On rajoute un nanoid au title donc 7 caractères en plus
    .min(1, { error: "The title must have at least 1 character" })