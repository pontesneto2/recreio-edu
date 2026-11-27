import { Button, Card, PreferencesPanel, StatusPill, TopBar } from '@recreio/design-system';
import { useLocation, useNavigate } from 'react-router';
import { salvarPreferencias } from '@/shared/preferencias/preferencias-salvas.ts';

/** Preferências de acessibilidade com prévia ao vivo. Fonte: `Familia-Preferencias`. */
export const PreferenciasPage = () => {
  const navigate = useNavigate();
  const { key } = useLocation();

  // Quem abriu o endereço direto não tem tela anterior no histórico do portal.
  const voltar = () => (key === 'default' ? navigate('/') : navigate(-1));

  return (
    <>
      <TopBar
        title="Acessibilidade e leitura"
        subtitle="Tamanho do texto, fonte, contraste e movimento"
        actions={
          <Button variant="ghost" icon="arrow-left" onClick={voltar}>
            Voltar
          </Button>
        }
      />
      <div className="rc-split">
        <PreferencesPanel onSave={salvarPreferencias} />
        <Card title="Prévia ao vivo" subtitle="Cada mudança aparece aqui na hora">
          <div style={{ display: 'grid', gap: 12 }}>
            <StatusPill tone="info" icon="bell">
              Comunicado · Secretaria
            </StatusPill>
            <h3 style={{ margin: 0 }}>Calendário de 2027 publicado</h3>
            <p style={{ margin: 0 }}>O calendário de 2027 já está na Agenda. As aulas voltam em 02/02.</p>
          </div>
        </Card>
      </div>
    </>
  );
};
