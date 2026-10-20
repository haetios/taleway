CREATE TYPE "categories" AS ENUM('romance', 'horror', 'adventure', 'sci_fi', 'historical', 'detective', 'fantasy');--> statement-breakpoint
CREATE TYPE "story_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" serial PRIMARY KEY,
	"profile_id" uuid NOT NULL,
	"story_id" integer NOT NULL,
	"node_id" text NOT NULL,
	"variables" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY,
	"username" varchar(255) NOT NULL UNIQUE,
	"bio" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" serial PRIMARY KEY,
	"profile_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"category" "categories",
	"graph" json NOT NULL,
	"status" "story_status" DEFAULT 'draft'::"story_status" NOT NULL,
	"cover_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_profile_id_story_id_index" ON "bookmarks" ("profile_id","story_id");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_profile_id_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_story_id_stories_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id");--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_profile_id_profiles_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id");