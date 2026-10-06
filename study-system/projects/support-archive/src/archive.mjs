import { DatabaseSync } from 'node:sqlite';
import { tickets } from './seed.mjs';

export function openArchive() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      requester TEXT NOT NULL,
      attachment_file TEXT NOT NULL
    )
  `);
  const insert = db.prepare(
    'INSERT INTO tickets (id, title, status, requester, attachment_file) VALUES (?, ?, ?, ?, ?)'
  );
  for (const row of tickets) insert.run(...row);
  return db;
}

export function listTickets(db) {
  return db.prepare('SELECT id, title, status, requester FROM tickets ORDER BY title').all();
}

export function findByStatus(db, status) {
  // Q1: implement exact status filtering, sorted by title.
  throw new Error('Q1_NOT_IMPLEMENTED');
}

export function findByRequester(db, name) {
  // Q2: implement exact requester filtering, sorted by title, at most five rows.
  throw new Error('Q2_NOT_IMPLEMENTED');
}

export function getTicket(db, id) {
  return db.prepare(
    'SELECT id, title, status, requester, attachment_file FROM tickets WHERE id = ?'
  ).get(id);
}
