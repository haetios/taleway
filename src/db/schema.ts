import { integer, json, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const ProfileRoles = { user: 'user', mod: 'mod', admin: 'admin' } as const;
export const profileRolesEnum = pgEnum("profile_roles", ProfileRoles)

export const StoryStatus = { draft: 'draft', published: 'published', archived: 'archived' } as const;
export const storyStatusEnum = pgEnum("story_status", StoryStatus);

export const StoryCategories = {
  romance: 'romance',
  horror: 'horror',
  adventure: 'adventure',
  sci_fi: 'sci_fi',
  historical: 'historical',
  detective: 'detective',
  fantasy: 'fantasy'
} as const;
export const categoriesEnum = pgEnum("categories", StoryCategories);

export const profiles = pgTable("profiles", {
  id: uuid().primaryKey(),
  username: varchar({ length: 255 }).notNull().unique(),
  bio: varchar({ length: 255 }),
  role: profileRolesEnum().notNull().default(ProfileRoles.user),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date())
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export const stories = pgTable("stories", {
  id: serial().primaryKey(),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' } ),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  blurb: text(), // Résumé (quatrière de couverture)
  category: categoriesEnum(),
  graph: json().notNull(),
  status: storyStatusEnum().notNull().default(StoryStatus.draft),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date())
});

export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;

export const bookmarks = pgTable("bookmarks", {
    id: serial().primaryKey(),
    profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    storyId: integer('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
    nodeId: text('node_id').notNull(),
    variables: json(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date())
  },
  (t) => [uniqueIndex().on(t.profileId, t.storyId)]
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
