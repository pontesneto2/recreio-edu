import { useToast } from '@recreio/design-system';
import { useEffect, useEffectEvent } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const ID_DO_AVISO = 'nova-versao';

/**
 * Registra o service worker e avisa por toast quando há versão nova. A troca só acontece
 * quando a pessoa toca em "Atualizar agora", para não recarregar a tela no meio de um formulário.
 */
export const AvisoDeAtualizacao = () => {
  const toast = useToast();
  const {
    needRefresh: [temVersaoNova],
    updateServiceWorker,
  } = useRegisterSW();

  // O objeto do toast muda a cada toast exibido; o aviso sai uma vez por versão nova.
  const avisar = useEffectEvent(() => {
    toast.show({
      id: ID_DO_AVISO,
      tone: 'info',
      icon: 'refresh',
      title: 'Versão nova do portal',
      message: 'Atualize para usar a versão mais recente. O que você salvou continua aqui.',
      duration: 0,
      action: { label: 'Atualizar agora', onClick: () => void updateServiceWorker(true) },
    });
  });

  useEffect(() => {
    if (temVersaoNova) avisar();
  }, [temVersaoNova]);

  return null;
};
