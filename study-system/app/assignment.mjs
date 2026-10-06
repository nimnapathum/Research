import { createHash } from 'node:crypto';

const sequences = [
  [['A', 'acceleration'], ['B', 'exploration']],
  [['A', 'exploration'], ['B', 'acceleration']],
  [['B', 'acceleration'], ['A', 'exploration']],
  [['B', 'exploration'], ['A', 'acceleration']]
];
const orders = [
  ['Q1', 'Q2', 'F1', 'F2'],
  ['Q2', 'F1', 'F2', 'Q1'],
  ['F1', 'F2', 'Q1', 'Q2'],
  ['F2', 'Q1', 'Q2', 'F1']
];

function rng(seed) {
  let state = createHash('sha256').update(seed).digest().readUInt32LE(0);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffledBlock(seed, block) {
  const result = [];
  const random = rng(`${seed}:${block}`);
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  // Each consecutive group of four covers every project/condition/order sequence,
  // candidate-status profile and checkpoint-order rotation once. A full block
  // still contains every sequence × profile combination exactly once.
  for (const round of shuffle([0, 1, 2, 3])) {
    for (const sequence of shuffle([0, 1, 2, 3])) {
      const profile = (sequence + round) % 4;
      result.push({ sequence, profile, order: (profile + 2 * sequence + block) % 4 });
    }
  }
  return result;
}

function statuses(profile, complement = false) {
  const q1Vulnerable = ((profile & 1) === 0) !== complement;
  const f1Vulnerable = ((profile & 2) === 0) !== complement;
  return {
    Q1: q1Vulnerable ? 'vulnerable' : 'secure',
    Q2: q1Vulnerable ? 'secure' : 'vulnerable',
    F1: f1Vulnerable ? 'vulnerable' : 'secure',
    F2: f1Vulnerable ? 'secure' : 'vulnerable'
  };
}

export function assignmentFor(participantId, ordinal, seed) {
  if (!/^P[0-9]{3,}$/.test(participantId) || !Number.isInteger(ordinal) || ordinal < 0) {
    throw new Error('Invalid participant ID or assignment ordinal');
  }
  const block = Math.floor(ordinal / 16);
  const cell = shuffledBlock(seed, block)[ordinal % 16];
  return {
    block,
    cell,
    tasks: sequences[cell.sequence].map(([project_id, condition], index) => ({
      task_id: `${participantId}-T${index + 1}`,
      project_id,
      condition,
      task_order: index + 1,
      checkpoint_order: orders[(cell.order + index * 2) % 4],
      candidate_status_by_checkpoint: statuses(cell.profile, index === 1)
    }))
  };
}
