import { once } from 'node:events';
import { createApp } from '../src/app.mjs';

export async function withApp(run) {
  const app = createApp();
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const { port } = app.server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
    app.close();
  }
}
