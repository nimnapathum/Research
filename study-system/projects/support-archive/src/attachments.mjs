import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';

export function readAttachmentByName(attachmentRoot, name) {
  // F1: return the named text file only if it stays under attachmentRoot.
  throw new Error('F1_NOT_IMPLEMENTED');
}

export function readTicketAttachment(attachmentRoot, storedName) {
  // F2: return the stored attachment only if it stays under attachmentRoot.
  throw new Error('F2_NOT_IMPLEMENTED');
}
