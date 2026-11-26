import { StatCard } from '@recreio/design-system';
import { useQuery } from '@tanstack/react-query';
import { escolaQuery } from '../api/escola.queries.ts';

const GRID_STYLE = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
} as const;

/** Um cartão por unidade com o total de alunos. */
export const UnidadesResumo = () => {
  const { data: escola } = useQuery(escolaQuery);

  return (
    <section aria-label="Unidades" style={GRID_STYLE}>
      {escola ? (
        escola.unidades.map((unidade) => (
          <StatCard
            key={unidade.id}
            label={`Alunos · ${unidade.nome}`}
            value={unidade.alunos}
            icon="school"
            color="azul"
          />
        ))
      ) : (
        <>
          <StatCard label="Carregando unidade" loading />
          <StatCard label="Carregando unidade" loading />
        </>
      )}
    </section>
  );
};
