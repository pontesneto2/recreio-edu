import type { Express } from 'express';
import type { AddressInfo } from 'node:net';
import { after, before } from 'node:test';

/** Sobe o app numa porta livre durante o `describe` atual e devolve a URL base. */
export const useServer = (createApp: () => Express) => {
  const server = createApp().listen(0);
  const handle = { baseUrl: '' };

  before(() => {
    handle.baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });
  after(() => {
    server.close();
  });

  return handle;
};
