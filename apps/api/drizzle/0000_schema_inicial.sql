CREATE TABLE "escolas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cnpj" text NOT NULL,
	"cidade" text NOT NULL,
	"cor_marca" text NOT NULL,
	"dominio" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "escolas_cnpj_unique" UNIQUE("cnpj"),
	CONSTRAINT "escolas_dominio_unique" UNIQUE("dominio"),
	CONSTRAINT "escolas_cor_marca_hex" CHECK ("escolas"."cor_marca" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "escolas_dominio_minusculo" CHECK ("escolas"."dominio" = lower("escolas"."dominio"))
);
--> statement-breakpoint
CREATE TABLE "unidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	CONSTRAINT "unidades_escola_slug_unique" UNIQUE("escola_id","slug"),
	CONSTRAINT "unidades_escola_id_unique" UNIQUE("escola_id","id")
);
--> statement-breakpoint
CREATE TABLE "turmas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"unidade_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"turno" text NOT NULL,
	"ano_letivo" integer NOT NULL,
	CONSTRAINT "turmas_escola_unidade_id_unique" UNIQUE("escola_id","unidade_id","id"),
	CONSTRAINT "turmas_unidade_ano_nome_unique" UNIQUE("unidade_id","ano_letivo","nome"),
	CONSTRAINT "turmas_turno_valido" CHECK ("turmas"."turno" in ('manha', 'tarde', 'integral', 'noite')),
	CONSTRAINT "turmas_ano_letivo_valido" CHECK ("turmas"."ano_letivo" between 2000 and 2100)
);
--> statement-breakpoint
CREATE TABLE "alunos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"unidade_id" uuid NOT NULL,
	"turma_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"matricula" text NOT NULL,
	"mensalidade_centavos" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alunos_escola_matricula_unique" UNIQUE("escola_id","matricula"),
	CONSTRAINT "alunos_mensalidade_nao_negativa" CHECK ("alunos"."mensalidade_centavos" >= 0)
);
--> statement-breakpoint
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_unidade_fk" FOREIGN KEY ("escola_id","unidade_id") REFERENCES "public"."unidades"("escola_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_unidade_fk" FOREIGN KEY ("escola_id","unidade_id") REFERENCES "public"."unidades"("escola_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turma_fk" FOREIGN KEY ("escola_id","unidade_id","turma_id") REFERENCES "public"."turmas"("escola_id","unidade_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alunos_escola_unidade_turma_idx" ON "alunos" USING btree ("escola_id","unidade_id","turma_id");