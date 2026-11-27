-- Busca a escola pelo slug da rota antes de existir app.escola_id (ADR 0011). Devolve só o id.
CREATE FUNCTION "escola_por_slug"(p_slug text) RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
  SELECT id FROM public.escolas WHERE slug = p_slug
$$;--> statement-breakpoint
ALTER FUNCTION "escola_por_slug"(text) OWNER TO recreio;--> statement-breakpoint
REVOKE ALL ON FUNCTION "escola_por_slug"(text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "escola_por_slug"(text) TO recreio_app;--> statement-breakpoint

-- Vínculos de uma conta em todas as escolas, para GET /api/v1/eu. vinculos tem FORCE RLS por escola,
-- e a leitura entre escolas passa por esta função, que roda como recreio e devolve só slug, nome e perfil.
-- A política abaixo libera SELECT em vinculos para o dono. recreio_app continua preso a app.escola_id.
CREATE POLICY "vinculos_leitura_do_dono" ON "vinculos" FOR SELECT TO recreio USING (true);--> statement-breakpoint
CREATE FUNCTION "vinculos_do_usuario"(p_usuario_id text)
  RETURNS TABLE (slug text, nome text, perfil text)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = pg_catalog, public
AS $$
  SELECT e.slug, e.nome, v.perfil
  FROM public.vinculos v
  JOIN public.escolas e ON e.id = v.escola_id
  WHERE v.usuario_id = p_usuario_id
  ORDER BY e.nome, v.perfil
$$;--> statement-breakpoint
ALTER FUNCTION "vinculos_do_usuario"(text) OWNER TO recreio;--> statement-breakpoint
REVOKE ALL ON FUNCTION "vinculos_do_usuario"(text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION "vinculos_do_usuario"(text) TO recreio_app;--> statement-breakpoint

-- escola_por_dominio fica até a versão anterior da API sair do ar. Uma migração futura a remove.
COMMENT ON FUNCTION "escola_por_dominio"(text) IS 'Obsoleta desde a ADR 0011. Remover depois do deploy da resolução por slug.';
