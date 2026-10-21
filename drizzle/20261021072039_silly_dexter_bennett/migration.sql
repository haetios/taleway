ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'user'::"profile_roles";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role" SET NOT NULL;