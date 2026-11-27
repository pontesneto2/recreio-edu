import type { Escola } from '@recreio/contracts';
import { StatCard } from '@recreio/design-system';
import { useQuery } from '@tanstack/react-query';
import { QueryState } from '@/shared/ui/QueryState.tsx';
import { escolaQuery } from '../api/escola.queries.ts';

const GRID_STYLE = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
} as const;

const semUnidades = (escola: Escola) => escola.unidades.length === 0;

/** Um cartão por unidade com o total de alunos. */
export const UnidadesResumo = () => {
  const query = useQuery(escolaQuery);

  return (
    <section aria-label="Unidades">
      <QueryState
        query={query}
        esqueleto={
          <div style={GRID_STYLE}>
            <StatCard label="Carregando unidade" loading />
            <StatCard label="Carregando unidade" loading />
          </div>
        }
        erro={{ titulo: 'Não conseguimos carregar as unidades' }}
        vazio={{
          quando: semUnidades,
          titulo: 'Nenhuma unidade cadastrada',
          texto: 'As unidades aparecem aqui assim que a secretaria cadastrar a primeira.',
        }}
      >
        {(escola) => (
          <div style={GRID_STYLE}>
            {escola.unidades.map((unidade) => (
              <StatCard
                key={unidade.id}
                label={`Alunos · ${unidade.nome}`}
                value={unidade.alunos}
                icon="school"
                color="azul"
              />
            ))}
          </div>
        )}
      </QueryState>
    </section>
  );
};
