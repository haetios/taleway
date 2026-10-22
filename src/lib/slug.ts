import { customAlphabet } from "nanoid";
import slugify from "slugify";

// alphabet sans caractères ambigus (pas de 0/O, 1/l)
const suffix = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 6); // Si modifier => modifier "slugRule" aussi

// Base tronquée : slug final = base + tiret + 6 suffixe <= 255 (varchar en DB)
const MAX_BASE_LENGTH = 255 - 1 - 6;

export const buildSlug = (title: string) => {
  const base = slugify(title, { lower: true, strict: true })
    .slice(0, MAX_BASE_LENGTH)
    // coupe proprement : pas de tiret final orphelin
    .replace(/-+$/, "");
  return `${base}-${suffix()}`;
};