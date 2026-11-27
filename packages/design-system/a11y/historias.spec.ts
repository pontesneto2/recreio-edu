import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Entrada = { id: string; title: string; name: string; type: 'story' | 'docs' };

const INDICE = fileURLToPath(new URL('../storybook-static/index.json', import.meta.url));
const { entries } = JSON.parse(readFileSync(INDICE, 'utf8')) as { entries: Record<string, Entrada> };
const historias = Object.values(entries).filter((entrada) => entrada.type === 'story');

// Animação desligada: o axe mede a cor final, sem pegar um elemento no meio da transição.
test.use({ reducedMotion: 'reduce' });

for (const { id, title, name } of historias) {
  test(`${title} / ${name}`, async ({ page }) => {
    // `a11y.manual` desliga a varredura do próprio addon, que disputaria o axe com esta.
    await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=a11y.manual:!true`);
    await expect(page.locator('#storybook-root > *').first()).toBeVisible({ timeout: 15_000 });

    // Mesmo alcance do addon: o body sem os elementos do Storybook, sem a regra `region`.
    const { violations } = await new AxeBuilder({ page })
      .include('body')
      .exclude('.sb-wrapper')
      .exclude('#storybook-docs')
      .exclude('#storybook-highlights-root')
      .disableRules(['region'])
      .analyze();

    // O preview usa `a11y: { test: 'error' }`: qualquer violação reprova, como no painel.
    const resumo = violations.map((v) => ({
      regra: v.id,
      impacto: v.impact,
      ajuda: v.help,
      alvos: v.nodes.map((no) => no.target.join(' ')),
    }));
    expect(resumo).toEqual([]);
  });
}
