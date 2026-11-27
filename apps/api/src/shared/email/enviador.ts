import nodemailer from 'nodemailer';
import type { Mensagem } from './modelos.ts';

export type EnvioEmail = Mensagem & {
  para: string;
  /** Vira o `Message-ID`. Repetir o envio da mesma tarefa repete o id, e o servidor de destino pode descartar. */
  id: string;
};

export type EnviadorEmail = {
  enviar: (envio: EnvioEmail) => Promise<void>;
  encerrar: () => void;
};

export type EnviadorEmailConfig = {
  /** `smtp://usuario:senha@host:porta` ou `smtps://...`. */
  smtpUrl: string;
  remetente: string;
};

/** Envia por SMTP com nodemailer. No ambiente local, o Mailpit recebe em `smtp://localhost:1025`. */
export const createEnviadorEmail = ({ smtpUrl, remetente }: EnviadorEmailConfig): EnviadorEmail => {
  const transporte = nodemailer.createTransport(smtpUrl);
  const dominio = remetente.match(/@([^>\s]+)/)?.[1] ?? 'recreio.app';

  return {
    enviar: async ({ para, assunto, texto, html, id }) => {
      await transporte.sendMail({
        from: remetente,
        to: para,
        subject: assunto,
        text: texto,
        html,
        messageId: `<${id}@${dominio}>`,
      });
    },
    encerrar: () => transporte.close(),
  };
};
