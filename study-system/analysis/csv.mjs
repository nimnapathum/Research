import { readFileSync, writeFileSync } from 'node:fs';

export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows.shift();
  return rows.filter((item) => item.some((value) => value !== '')).map((item) => {
    if (item.length !== header.length) throw new Error('CSV column count mismatch');
    return Object.fromEntries(header.map((key, index) => [key, item[index]]));
  });
}

export function readCsv(path) { return parseCsv(readFileSync(path, 'utf8')); }
function cell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function writeCsv(path, header, rows) {
  writeFileSync(path, header.join(',') + '\n' + rows.map((row) => header.map((key) => cell(row[key])).join(',')).join('\n') + '\n');
}
