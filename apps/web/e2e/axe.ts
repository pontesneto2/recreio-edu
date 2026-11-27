import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Impactos que reprovam o teste. `moderate` e `minor` ficam no relatório do axe, sem bloquear. */
const IMPACTOS_QUE_REPROVAM = new Set(['serious', 'critical']);

/**
 * Espera as animações de entrada terminarem. No meio do fade, o texto ainda está claro e o axe acusa contraste.
 * Animações sem fim (esqueleto, carregando) ficam de fora.
 */
const esperarAnimacoesDeEntrada = (page: Page) =>
  page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animacao) => animacao.effect?.getTiming().iterations !== Infinity)
      .every((animacao) => animacao.playState !== 'running'),
  );

/** Roda o axe (WCAG 2.1 A e AA) na página inteira e reprova com violação séria ou crítica. */
export const esperarSemViolacoesGraves = async (page: Page) => {
  await esperarAnimacoesDeEntrada(page);
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const graves = violations
    .filter((v) => v.impact && IMPACTOS_QUE_REPROVAM.has(v.impact))
    .map((v) => ({ regra: v.id, impacto: v.impact, ajuda: v.help, alvos: v.nodes.map((no) => no.target.join(' ')) }));
  expect(graves, `Violações graves do axe em ${page.url()}`).toEqual([]);
};
