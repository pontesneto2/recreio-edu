-- Isolamento por escola (ADR 0006).
-- A API conecta como recreio_app e define app.escola_id em cada transação.
-- Sem app.escola_id, as políticas não liberam nenhuma linha.
-- nullif trata o valor vazio que o Postgres devolve depois que um set_config local termina.

ALTER TABLE "unidades" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "unidades" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "unidades_da_escola" ON "unidades"
  USING ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid);--> statement-breakpoint

ALTER TABLE "turmas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "turmas" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "turmas_da_escola" ON "turmas"
  USING ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid);--> statement-breakpoint

ALTER TABLE "alunos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "alunos" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "alunos_da_escola" ON "alunos"
  USING ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid);--> statement-breakpoint

-- escolas fica sem FORCE: o dono (recreio) lê a tabela inteira dentro de escola_por_dominio.
-- Para recreio_app só existe política de leitura, então ele não cria, altera nem apaga escolas.
ALTER TABLE "escolas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "escolas_da_escola" ON "escolas" FOR SELECT
  USING ("id" = nullif(current_setting('app.escola_id', true), '')::uuid);--> statement-breakpoint

-- Busca a escola pelo Host antes de existir app.escola_id. Devolve só o id.
CREATE FUNCTION "escola_por_dominio"(p_dominio text) RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
  SELECT id FROM public.escolas WHERE dominio = lower(p_dominio)
$$;--> statement-breakpoint
ALTER FUNCTION "escola_por_dominio"(text) OWNER TO recreio;--> statement-breakpoint
REVOKE ALL ON FUNCTION "escola_por_dominio"(text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "escola_por_dominio"(text) TO recreio_app;--> statement-breakpoint

-- Permissões explícitas, sem depender dos privilégios padrão do init do Docker.
GRANT USAGE ON SCHEMA public TO recreio_app;--> statement-breakpoint
REVOKE ALL ON "escolas" FROM recreio_app;--> statement-breakpoint
GRANT SELECT ON "escolas" TO recreio_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "unidades", "turmas", "alunos" TO recreio_app;
