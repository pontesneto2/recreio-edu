CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "account_provider_account_unique" UNIQUE("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vinculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"usuario_id" text NOT NULL,
	"perfil" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vinculos_escola_usuario_perfil_unique" UNIQUE("escola_id","usuario_id","perfil"),
	CONSTRAINT "vinculos_perfil_valido" CHECK ("vinculos"."perfil" in ('responsavel', 'aluno', 'professor', 'secretaria', 'financeiro', 'portaria', 'coordenacao', 'direcao'))
);
--> statement-breakpoint
CREATE TABLE "permissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"perfil" text NOT NULL,
	"modulo" text NOT NULL,
	"acoes" text[] NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissoes_escola_perfil_modulo_unique" UNIQUE("escola_id","perfil","modulo"),
	CONSTRAINT "permissoes_perfil_valido" CHECK ("permissoes"."perfil" in ('responsavel', 'aluno', 'professor', 'secretaria', 'financeiro', 'portaria', 'coordenacao', 'direcao')),
	CONSTRAINT "permissoes_modulo_formato" CHECK ("permissoes"."modulo" ~ '^[a-z][a-z0-9-]*$'),
	CONSTRAINT "permissoes_acoes_validas" CHECK ("permissoes"."acoes" <@ array['ver', 'criar', 'editar', 'excluir', 'aprovar']::text[]),
	CONSTRAINT "permissoes_acoes_nao_vazias" CHECK (cardinality("permissoes"."acoes") > 0)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vinculos" ADD CONSTRAINT "vinculos_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vinculos" ADD CONSTRAINT "vinculos_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissoes" ADD CONSTRAINT "permissoes_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "vinculos_usuario_idx" ON "vinculos" USING btree ("usuario_id");