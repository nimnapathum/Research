import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';

export function readPreviewByName(previewRoot, name) {
  // F1: return the named text file only if it stays under previewRoot.
  throw new Error('F1_NOT_IMPLEMENTED');
}

export function readResourcePreview(previewRoot, storedName) {
  // F2: return the stored preview only if it stays under previewRoot.
  throw new Error('F2_NOT_IMPLEMENTED');
}
