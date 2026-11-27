import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { NotFoundError } from '../../shared/errors/app-error.ts';
import type { DadosEscola, EscolaRepository } from './escola.repository.ts';
import { createEscolaService } from './escola.service.ts';

const CONTEXTO = { escolaId: '6f1c1c1e-0000-4000-8000-000000000001' };

const recreio: DadosEscola = {
  nome: 'Colégio Recreio',
  cnpj: '07.412.386/0001-52',
  cidade: 'Fortaleza',
  corMarca: '#0067CC',
  unidades: [{ id: '6f1c1c1e-0000-4000-8000-0000000000a1', nome: 'Unidade Aldeota', alunos: 2 }],
};

const repositorio = (escola?: DadosEscola): EscolaRepository => ({
  get: async () => escola,
  getPublica: async () =>
    escola && { slug: 'colegio-recreio', nome: escola.nome, cidade: escola.cidade, corMarca: escola.corMarca },
});

describe('EscolaService', () => {
  test('usa a data de Fortaleza como hoje', async () => {
    // 02h de 26/11 em UTC ainda é 25/11 em Fortaleza (UTC-3).
    const service = createEscolaService(repositorio(recreio), () => new Date('2026-11-26T02:00:00Z'));
    const escola = await service.obter(CONTEXTO);
    assert.equal(escola.hoje, '2026-11-25');
    assert.equal(escola.unidades[0]?.alunos, 2);
  });

  test('lança NotFoundError quando a escola não existe', async () => {
    const service = createEscolaService(repositorio());
    await assert.rejects(service.obter(CONTEXTO), NotFoundError);
    await assert.rejects(service.obterPublica(CONTEXTO), NotFoundError);
  });

  test('os dados públicos têm só slug, nome, cidade e cor', async () => {
    const service = createEscolaService(repositorio(recreio));
    assert.deepEqual(await service.obterPublica(CONTEXTO), {
      slug: 'colegio-recreio',
      nome: 'Colégio Recreio',
      cidade: 'Fortaleza',
      corMarca: '#0067CC',
    });
  });
});
