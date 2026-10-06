import { createApp } from './app.mjs';

const port = Number(process.env.PORT ?? 4174);
const { server } = createApp();
server.listen(port, '127.0.0.1', () => {
  console.log(`Support archive listening at http://127.0.0.1:${port}`);
});
