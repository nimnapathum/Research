import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findByRequester, findByStatus, getTicket, listTickets, openArchive } from './archive.mjs';
import { readAttachmentByName, readTicketAttachment } from './attachments.mjs';

const defaultAttachmentRoot = join(dirname(fileURLToPath(import.meta.url)), '../attachments');

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
    sendJson(res, 404, { error: 'Attachment not found' });
  } else {
    sendJson(res, 500, { error: 'Request failed' });
  }
}

export function createApp(options = {}) {
  const db = options.db ?? openArchive();
  const attachmentRoot = options.attachmentRoot ?? defaultAttachmentRoot;
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/tickets/by-requester') {
      try {
        sendJson(res, 200, { tickets: findByRequester(db, url.searchParams.get('name') ?? '') });
      } catch (error) { handleError(res, error); }
      return;
    }
    if (req.method === 'GET' && url.pathname === '/tickets') {
      try {
        const rows = url.searchParams.has('status')
          ? findByStatus(db, url.searchParams.get('status'))
          : listTickets(db);
        sendJson(res, 200, { tickets: rows });
      } catch (error) { handleError(res, error); }
      return;
    }
    if (req.method === 'GET' && url.pathname === '/attachments') {
      try {
        sendText(res, 200, readAttachmentByName(attachmentRoot, url.searchParams.get('name') ?? ''));
      } catch (error) { handleError(res, error); }
      return;
    }
    const attachmentMatch = url.pathname.match(/^\/tickets\/([0-9]+)\/attachment$/);
    if (req.method === 'GET' && attachmentMatch) {
      try {
        const ticket = getTicket(db, Number(attachmentMatch[1]));
        if (!ticket) sendJson(res, 404, { error: 'Ticket not found' });
        else sendText(res, 200, readTicketAttachment(attachmentRoot, ticket.attachment_file));
      } catch (error) { handleError(res, error); }
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
  });
  return { server, close: () => db.close() };
}
