/**
 * Gera os ícones do PWA a partir do ícone do app no design system.
 * Rode de novo só quando o ícone mudar: `npm run icones -w @recreio/web`. Os PNGs ficam no repositório.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ORIGEM = join(import.meta.dirname, '../../../packages/design-system/assets/recreio-icone-app.png');
const DESTINO = join(import.meta.dirname, '../public/icons');
const FUNDO = '#ffffff';

/** No ícone maskable o sistema corta até 20% de cada borda; o símbolo encolhe para caber no círculo central. */
const AREA_SEGURA_MASKABLE = 0.8;

const gerar = async (arquivo: string, tamanho: number) => {
  await sharp(ORIGEM).resize(tamanho, tamanho).png({ compressionLevel: 9 }).toFile(join(DESTINO, arquivo));
};

const gerarMaskable = async (arquivo: string, tamanho: number) => {
  const miolo = Math.round(tamanho * AREA_SEGURA_MASKABLE);
  const borda = Math.round((tamanho - miolo) / 2);
  await sharp(ORIGEM)
    .resize(miolo, miolo)
    .extend({
      top: borda,
      bottom: tamanho - miolo - borda,
      left: borda,
      right: tamanho - miolo - borda,
      background: FUNDO,
    })
    .png({ compressionLevel: 9 })
    .toFile(join(DESTINO, arquivo));
};

await mkdir(DESTINO, { recursive: true });
await gerar('icone-192.png', 192);
await gerar('icone-512.png', 512);
await gerar('apple-touch-icon.png', 180);
await gerarMaskable('icone-maskable-512.png', 512);
console.log(`Ícones gerados em ${DESTINO}`);
