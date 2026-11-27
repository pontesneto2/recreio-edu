-- Vínculos e permissões são dados da escola: mesma política das outras tabelas com escola_id (ADR 0006).

ALTER TABLE "vinculos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vinculos" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "vinculos_da_escola" ON "vinculos"
  USING ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid);--> statement-breakpoint

ALTER TABLE "permissoes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "permissoes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "permissoes_da_escola" ON "permissoes"
  USING ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid)
  WITH CHECK ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid);--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON "vinculos", "permissoes" TO recreio_app;--> statement-breakpoint

-- Tabelas do Better Auth (ADR 0007). São globais, sem escola_id e sem RLS: a conta vale em qualquer escola.
-- A API grava nelas como recreio_app, fora de withEscola. O acesso à escola depende de vinculos.
GRANT SELECT, INSERT, UPDATE, DELETE ON "user", "session", "account", "verification" TO recreio_app;
