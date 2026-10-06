import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findByAuthor, findByTopic, getResource, listResources, openCatalogue } from './catalogue.mjs';
import { readPreviewByName, readResourcePreview } from './previews.mjs';

const defaultPreviewRoot = join(dirname(fileURLToPath(import.meta.url)), '../previews');

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendText(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function handleError(res, error) {
  if (error.message.endsWith('_NOT_IMPLEMENTED')) {
    sendJson(res, 501, { error: 'Feature is not implemented' });
  } else if (error.code === 'ENOENT') {
    sendJson(res, 404, { error: 'Preview not found' });
  } else {
    sendJson(res, 500, { error: 'Request failed' });
  }
}

export function createApp(options = {}) {
  const db = options.db ?? openCatalogue();
  const previewRoot = options.previewRoot ?? defaultPreviewRoot;
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/resources/by-author') {
      try {
        sendJson(res, 200, { resources: findByAuthor(db, url.searchParams.get('name') ?? '') });
      } catch (error) {
        handleError(res, error);
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/resources') {
      try {
        const rows = url.searchParams.has('topic')
          ? findByTopic(db, url.searchParams.get('topic'))
          : listResources(db);
        sendJson(res, 200, { resources: rows });
      } catch (error) {
        handleError(res, error);
      }
      return;
    }

    if (req.method === 'GET' && url.pathname === '/previews') {
      try {
        sendText(res, 200, readPreviewByName(previewRoot, url.searchParams.get('name') ?? ''));
      } catch (error) {
        handleError(res, error);
      }
      return;
    }

    const previewMatch = url.pathname.match(/^\/resources\/([0-9]+)\/preview$/);
    if (req.method === 'GET' && previewMatch) {
      try {
        const resource = getResource(db, Number(previewMatch[1]));
        if (!resource) {
          sendJson(res, 404, { error: 'Resource not found' });
        } else {
          sendText(res, 200, readResourcePreview(previewRoot, resource.preview_file));
        }
      } catch (error) {
        handleError(res, error);
      }
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  });

  return { server, close: () => db.close() };
}
