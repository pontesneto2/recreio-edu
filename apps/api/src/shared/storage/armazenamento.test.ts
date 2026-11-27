import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { NotFoundError } from '../errors/app-error.ts';
import { type Armazenamento, createArmazenamento } from './armazenamento.ts';

const ESCOLA_A = '0f4f6a1e-1111-4000-8000-000000000001';
const ESCOLA_B = '0f4f6a1e-2222-4000-8000-000000000002';
const CREDENCIAIS = { accessKeyId: 'recreio', secretAccessKey: 'recreio-storage' };

/** A mesma imagem do docker-compose.yml. */
const IMAGEM_RUSTFS = 'rustfs/rustfs:latest';

const configurar = (endpoint: string, bucket: string): Armazenamento =>
  createArmazenamento({
    endpoint,
    regiao: 'us-east-1',
    credenciais: CREDENCIAIS,
    bucket,
    forcePathStyle: true,
    validadeSegundos: 60,
  });

/** O RustFS abre a porta antes de aceitar requisições. Tenta até o bucket responder. */
const esperarPronto = async (armazenamento: Armazenamento) => {
  for (let tentativa = 1; ; tentativa += 1) {
    try {
      await armazenamento.prepararBucket('criar');
      return;
    } catch (err) {
      if (tentativa >= 30) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

describe('armazenamento S3 (RustFS)', () => {
  let container: StartedTestContainer | undefined;
  let endpoint = '';
  let motivoParaPular: string | undefined;

  before(async () => {
    try {
      container = await new GenericContainer(IMAGEM_RUSTFS)
        .withEnvironment({ RUSTFS_ACCESS_KEY: CREDENCIAIS.accessKeyId, RUSTFS_SECRET_KEY: CREDENCIAIS.secretAccessKey })
        .withExposedPorts(9000)
        .withWaitStrategy(Wait.forListeningPorts())
        .start();
      endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;
    } catch (err) {
      motivoParaPular = `RustFS não subiu pelo Testcontainers (${err instanceof Error ? err.message : String(err)}). Confira o Docker.`;
    }
  });

  after(async () => {
    await container?.stop();
  });

  test('em desenvolvimento cria o bucket que falta; em produção só confere', async (t) => {
    if (motivoParaPular) return t.skip(motivoParaPular);
    const armazenamento = configurar(endpoint, 'recreio-modos');
    try {
      await esperarPronto(configurar(endpoint, 'recreio-espera'));
      await assert.rejects(armazenamento.prepararBucket('verificar'), /não existe/);
      assert.equal(await armazenamento.prepararBucket('criar'), 'criado');
      assert.equal(await armazenamento.prepararBucket('criar'), 'existia');
      assert.equal(await armazenamento.prepararBucket('verificar'), 'existia');
    } finally {
      armazenamento.encerrar();
    }
  });

  test('upload e download por URL assinada, com a chave no prefixo da escola', async (t) => {
    if (motivoParaPular) return t.skip(motivoParaPular);
    const armazenamento = configurar(endpoint, 'recreio');
    try {
      await esperarPronto(armazenamento);
      const upload = await armazenamento.presignUpload({
        escolaId: ESCOLA_A,
        caminho: 'alunos/davi/rg.txt',
        contentType: 'text/plain',
      });
      assert.equal(upload.chave, `${ESCOLA_A}/alunos/davi/rg.txt`);
      assert.match(upload.url, /X-Amz-Expires=60/);
      assert.ok(upload.expiraEm.getTime() > Date.now());

      const envio = await fetch(upload.url, { method: upload.metodo, headers: upload.cabecalhos, body: 'RG do Davi' });
      assert.equal(envio.status, 200, await envio.text());

      const download = await armazenamento.presignDownload({ escolaId: ESCOLA_A, chave: upload.chave });
      const leitura = await fetch(download.url);
      assert.equal(leitura.status, 200);
      assert.equal(await leitura.text(), 'RG do Davi');

      await assert.rejects(armazenamento.presignDownload({ escolaId: ESCOLA_B, chave: upload.chave }), NotFoundError);
    } finally {
      armazenamento.encerrar();
    }
  });

  test('a URL de upload não serve para outro Content-Type', async (t) => {
    if (motivoParaPular) return t.skip(motivoParaPular);
    const armazenamento = configurar(endpoint, 'recreio');
    try {
      await esperarPronto(armazenamento);
      const upload = await armazenamento.presignUpload({
        escolaId: ESCOLA_A,
        caminho: 'x.pdf',
        contentType: 'application/pdf',
      });
      const envio = await fetch(upload.url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/html' },
        body: '<html>',
      });
      assert.equal(envio.status, 403);
    } finally {
      armazenamento.encerrar();
    }
  });
});
