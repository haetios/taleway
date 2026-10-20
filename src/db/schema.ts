import { integer, json, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const storyStatusEnum = pgEnum("story_status", ["draft", "published", "archived"]);
export const categoriesEnum = pgEnum("categories", [
  "romance",
  "horror",
  "adventure",
  "sci_fi",
  "historical",
  "detective",
  "fantasy"
]);

export const profiles = pgTable("profiles", {
  id: uuid().primaryKey(),
  username: varchar({ length: 255 }).notNull().unique(),
  bio: varchar({ length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date())
});

export const stories = pgTable("stories", {
  id: serial().primaryKey(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  category: categoriesEnum(),
  graph: json().notNull(),
  status: storyStatusEnum().notNull().default("draft"),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date())
});

export const bookmarks = pgTable("bookmarks", {
    id: serial().primaryKey(),
    profileId: uuid('profile_id').notNull().references(() => profiles.id),
    storyId: integer('story_id').notNull().references(() => stories.id),
    nodeId: text().notNull(),
    variables: json(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date())
  },
  (t: any) => [uniqueIndex().on(t.profileId, t.storyId)]
);
