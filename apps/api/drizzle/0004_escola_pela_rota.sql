-- A escola passa a ser identificada pela rota, não pelo Host (ADR 0011).
-- Escolas que já existem ganham o slug a partir do primeiro rótulo do domínio. O seed corrige o do Colégio Recreio.
ALTER TABLE "escolas" ALTER COLUMN "dominio" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "escolas" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "escolas" SET "slug" = trim(both '-' from regexp_replace(split_part("dominio", '.', 1), '[^a-z0-9]+', '-', 'g'));--> statement-breakpoint
ALTER TABLE "escolas" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "escolas" ADD CONSTRAINT "escolas_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "escolas" ADD CONSTRAINT "escolas_slug_formato" CHECK ("escolas"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length("escolas"."slug") <= 63);
