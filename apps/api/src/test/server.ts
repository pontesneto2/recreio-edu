import type { Express } from 'express';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before } from 'node:test';

/**
 * Sobe o app numa porta livre durante o `describe` atual e devolve a URL base.
 * O app é criado no `before`, então a fábrica pode usar o banco que um `before` anterior subiu.
 */
export const useServer = (createApp: () => Express) => {
  const handle = { baseUrl: '', port: 0 };
  let server: Server | undefined;

  before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await once(server, 'listening');
    handle.port = (server.address() as AddressInfo).port;
    handle.baseUrl = `http://127.0.0.1:${handle.port}`;
  });
  after(() => {
    server?.closeAllConnections();
    server?.close();
  });

  return handle;
};
