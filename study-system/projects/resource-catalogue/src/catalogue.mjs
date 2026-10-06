import { DatabaseSync } from 'node:sqlite';
import { resources } from './seed.mjs';

export function openCatalogue() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE resources (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      author TEXT NOT NULL,
      preview_file TEXT NOT NULL
    )
  `);

  const insert = db.prepare(
    'INSERT INTO resources (id, title, topic, author, preview_file) VALUES (?, ?, ?, ?, ?)'
  );
  for (const row of resources) insert.run(...row);
  return db;
}

export function listResources(db) {
  return db.prepare(
    'SELECT id, title, topic, author FROM resources ORDER BY title'
  ).all();
}

export function findByTopic(db, topic) {
  // Q1: implement exact topic filtering, sorted by title.
  throw new Error('Q1_NOT_IMPLEMENTED');
}

export function findByAuthor(db, name) {
  // Q2: implement exact author filtering, sorted by title, at most five rows.
  throw new Error('Q2_NOT_IMPLEMENTED');
}

export function getResource(db, id) {
  return db.prepare(
    'SELECT id, title, topic, author, preview_file FROM resources WHERE id = ?'
  ).get(id);
}
