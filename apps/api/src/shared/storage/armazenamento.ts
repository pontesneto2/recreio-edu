import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { chaveDoArquivo, conferirChaveDaEscola } from './chaves.ts';

export type ArmazenamentoConfig = {
  /** Endpoint que a API usa. Sem valor, o SDK usa o endpoint da AWS da região. */
  endpoint?: string;
  /** Endpoint das URLs assinadas, quando o navegador chega no armazenamento por outro endereço. */
  endpointPublico?: string;
  regiao: string;
  /** Sem chaves, o SDK usa a cadeia padrão de credenciais. */
  credenciais?: { accessKeyId: string; secretAccessKey: string };
  bucket: string;
  forcePathStyle: boolean;
  /** Validade das URLs assinadas, em segundos. */
  validadeSegundos: number;
};

export type UrlAssinada = {
  url: string;
  chave: string;
  expiraEm: Date;
};

export type UploadAssinado = UrlAssinada & {
  metodo: 'PUT';
  /** Cabeçalhos que o navegador precisa enviar no PUT. Fazem parte da assinatura. */
  cabecalhos: Record<string, string>;
};

/** `criar` cria o bucket ausente (desenvolvimento). `verificar` só confere que ele existe (produção). */
export type ModoBucket = 'criar' | 'verificar';

export type Armazenamento = {
  bucket: string;
  /** Confere o bucket. Devolve `criado` quando precisou criar. */
  prepararBucket: (modo: ModoBucket) => Promise<'existia' | 'criado'>;
  /** URL para o navegador enviar o arquivo direto ao armazenamento, sem passar pela API. */
  presignUpload: (pedido: { escolaId: string; caminho: string; contentType: string }) => Promise<UploadAssinado>;
  /** URL de leitura. Rejeita com 404 quando a chave é de outra escola. */
  presignDownload: (pedido: { escolaId: string; chave: string; nomeArquivo?: string }) => Promise<UrlAssinada>;
  encerrar: () => void;
};

const criarCliente = (config: ArmazenamentoConfig, endpoint: string | undefined) =>
  new S3Client({
    endpoint,
    region: config.regiao,
    credentials: config.credenciais,
    forcePathStyle: config.forcePathStyle,
    // Sem isto o SDK põe checksum CRC32 na URL assinada, e o PUT do navegador com outro corpo falha.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

const naoEncontrado = (err: unknown) =>
  err instanceof S3ServiceException && (err.name === 'NotFound' || err.$metadata.httpStatusCode === 404);

/** Nome de arquivo seguro no `Content-Disposition`: sem aspas, barras nem quebras de linha. */
const nomeSeguro = (nome: string) => nome.replace(/["\\\r\n/]/g, '_');

/** Armazenamento compatível com S3 (ADR 0010). RustFS no ambiente local, S3 do provedor em produção. */
export const createArmazenamento = (config: ArmazenamentoConfig): Armazenamento => {
  const cliente = criarCliente(config, config.endpoint);
  const assinador = config.endpointPublico ? criarCliente(config, config.endpointPublico) : cliente;
  const { bucket } = config;

  const expiraEm = () => new Date(Date.now() + config.validadeSegundos * 1000);

  return {
    bucket,
    prepararBucket: async (modo) => {
      try {
        await cliente.send(new HeadBucketCommand({ Bucket: bucket }));
        return 'existia';
      } catch (err) {
        if (!naoEncontrado(err)) throw err;
        if (modo === 'verificar') throw new Error(`O bucket ${bucket} não existe.`, { cause: err });
      }
      await cliente.send(new CreateBucketCommand({ Bucket: bucket }));
      return 'criado';
    },
    presignUpload: async ({ escolaId, caminho, contentType }) => {
      const chave = chaveDoArquivo(escolaId, caminho);
      const comando = new PutObjectCommand({ Bucket: bucket, Key: chave, ContentType: contentType });
      // O Content-Type entra na assinatura. Um PUT com outro tipo recebe 403.
      const url = await getSignedUrl(assinador, comando, {
        expiresIn: config.validadeSegundos,
        signableHeaders: new Set(['content-type']),
      });
      return { url, chave, expiraEm: expiraEm(), metodo: 'PUT', cabecalhos: { 'Content-Type': contentType } };
    },
    presignDownload: async ({ escolaId, chave, nomeArquivo }) => {
      conferirChaveDaEscola(escolaId, chave);
      const comando = new GetObjectCommand({
        Bucket: bucket,
        Key: chave,
        ResponseContentDisposition: nomeArquivo ? `attachment; filename="${nomeSeguro(nomeArquivo)}"` : undefined,
      });
      const url = await getSignedUrl(assinador, comando, { expiresIn: config.validadeSegundos });
      return { url, chave, expiraEm: expiraEm() };
    },
    encerrar: () => {
      cliente.destroy();
      if (assinador !== cliente) assinador.destroy();
    },
  };
};
