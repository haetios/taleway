import z from "zod";

export const blurbRule = z.string().max(1, { error: "The book's blurb can't be empty" }) // Ajouter max ?