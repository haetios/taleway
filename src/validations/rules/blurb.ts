import z from "zod";

/** Blurb (quatrième de couverture) : non vide, 2000 caractères max. */
export const blurbRule = z.string().min(1, { error: "The book's blurb can't be empty" }).max(2000, { error: "The book's blurb is too long" })