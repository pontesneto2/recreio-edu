import type { Preferences } from '@recreio/design-system';
import { z } from 'zod';

const CHAVE = 'recreio.preferencias';

const preferenciasSchema = z
  .object({
    textScale: z.number().min(100).max(200),
    spacing: z.enum(['normal', 'amplo']),
    font: z.enum(['padrao', 'legivel']),
    motion: z.enum(['sistema', 'reduzido']),
    focus: z.boolean(),
    reading: z.enum(['normal', 'simples']),
    theme: z.enum(['claro', 'escuro', 'alto-contraste', 'alto-contraste-escuro']),
  })
  .partial();

/**
 * Preferências de acessibilidade gravadas neste navegador. Um valor corrompido ou de versão
 * antiga é ignorado e a pessoa volta ao padrão. Com login, as preferências passam a vir da conta.
 */
export const carregarPreferencias = (): Partial<Preferences> => {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    const resultado = preferenciasSchema.safeParse(salvo ? JSON.parse(salvo) : {});
    return resultado.success ? resultado.data : {};
  } catch {
    return {};
  }
};

export const salvarPreferencias = (preferencias: Preferences) => {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(preferenciasSchema.parse(preferencias)));
  } catch {
    // Navegador sem armazenamento (aba anônima no Safari): a preferência vale até fechar a aba.
  }
};
