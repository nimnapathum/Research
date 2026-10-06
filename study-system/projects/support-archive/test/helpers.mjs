import { once } from 'node:events';
import { createApp } from '../src/app.mjs';

export async function withApp(run, options = {}) {
  const app = createApp(options);
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const { port } = app.server.address();
  try { await run(`http://127.0.0.1:${port}`); }
  finally {
    await new Promise((resolve) => app.server.close(resolve));
    app.close();
  }
}
