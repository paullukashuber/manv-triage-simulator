CREATE TABLE "case_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"description" text NOT NULL,
	"reasoning" text NOT NULL,
	"findings" jsonb NOT NULL,
	"focus_fields" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"computed_category" text NOT NULL,
	"decisive_step" text,
	"algorithm_version" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_by" text,
	CONSTRAINT "case_revisions_case_id_revision_number_unique" UNIQUE("case_id","revision_number")
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"description" text NOT NULL,
	"reasoning" text NOT NULL,
	"findings" jsonb NOT NULL,
	"expected_category" text NOT NULL,
	"focus_fields" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"computed_category" text NOT NULL,
	"decisive_step" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_id" text,
	"published_revision_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "case_revisions" ADD CONSTRAINT "case_revisions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;