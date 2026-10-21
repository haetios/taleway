import z from "zod";

export const titleRule = z.string().trim().max(248).min(1) // On rajoute un nanoid au title donc 7 caractères en plus