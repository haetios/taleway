CREATE TYPE "profile_roles" AS ENUM('user', 'mod', 'admin');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "role" "profile_roles";