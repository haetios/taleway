import { customAlphabet } from "nanoid";
import slugify from "slugify";

// alphabet sans caractères ambigus (pas de 0/O, 1/l)
const suffix = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 6); // Si modifier => modifier "slugRule" aussi

export const buildSlug = (title: string) =>
  `${slugify(title, { lower: true, strict: true })}-${suffix()}`;