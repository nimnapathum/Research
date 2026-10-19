import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const combinations = [
  [['A', 'acceleration'], ['B', 'exploration']],
  [['A', 'exploration'], ['B', 'acceleration']],
  [['B', 'acceleration'], ['A', 'exploration']],
  [['B', 'exploration'], ['A', 'acceleration']]
];
const projects = { A: 'resource-catalogue', B: 'support-archive' };
import { walkFiles, runCapture } from './natural_capture.mjs';
const ignored = new Set(['.git', 'node_modules', '.DS_Store', '.study-capture']);
const protocolVersion = 'natural-2026-10-13-r3';
const orientationRevision = '2026-10-18-v3';
const stimulusRevision = '2026-10-19-abstract-brief-v2';
function fail(message) { throw new Error(message); }
function replaceExactly(path, before, after) {
  const source = readFileSync(path, 'utf8');
  if (source.split(before).length !== 2) fail(`Unexpected starter source: ${path}`);
  writeFileSync(path, source.replace(before, after));
}
function addExplorationInterface(workspace, projectId) {
  const source = join(workspace, 'src');
  const recordsFile = join(source, projectId === 'A' ? 'catalogue.mjs' : 'archive.mjs');
  const appFile = join(source, 'app.mjs');
  const bridge = `import { readFileSync, realpathSync } from 'node:fs';

// This adapter supplies operations, not SQL escaping or a file-access policy.
export function recordPort(database) {
  return Object.freeze({
    rows({ statement, values = [] }) { return database.prepare(statement).all(...values); },
    row({ statement, values = [] }) { return database.prepare(statement).get(...values); },
    close() { database.close(); }
  });
}

export function documentPort(rootPath) {
  return Object.freeze({
    rootPath() { return rootPath; },
    canonicalPath(path) { return realpathSync(path); },
    readText(path) { return readFileSync(path, 'utf8'); }
  });
}
`;
  writeFileSync(join(source, 'study-bridge.mjs'), bridge);
  replaceExactly(recordsFile, "import { DatabaseSync } from 'node:sqlite';", "import { DatabaseSync } from 'node:sqlite';\nimport { recordPort } from './study-bridge.mjs';");
  replaceExactly(recordsFile, '  return db;\n}', '  return recordPort(db);\n}');
  if (projectId === 'A') {
    replaceExactly(recordsFile, "return db.prepare(\n    'SELECT id, title, topic, author FROM resources ORDER BY title'\n  ).all();", "return db.rows({ statement: 'SELECT id, title, topic, author FROM resources ORDER BY title' });");
    replaceExactly(recordsFile, "return db.prepare(\n    'SELECT id, title, topic, author, preview_file FROM resources WHERE id = ?'\n  ).get(id);", "return db.row({ statement: 'SELECT id, title, topic, author, preview_file FROM resources WHERE id = ?', values: [id] });");
    replaceExactly(appFile, "import { readPreviewByName, readResourcePreview } from './previews.mjs';", "import { readPreviewByName, readResourcePreview } from './previews.mjs';\nimport { documentPort } from './study-bridge.mjs';");
    replaceExactly(appFile, 'const previewRoot = options.previewRoot ?? defaultPreviewRoot;', 'const previewRoot = documentPort(options.previewRoot ?? defaultPreviewRoot);');
  } else {
    replaceExactly(recordsFile, "return db.prepare('SELECT id, title, status, requester FROM tickets ORDER BY title').all();", "return db.rows({ statement: 'SELECT id, title, status, requester FROM tickets ORDER BY title' });");
    replaceExactly(recordsFile, "return db.prepare(\n    'SELECT id, title, status, requester, attachment_file FROM tickets WHERE id = ?'\n  ).get(id);", "return db.row({ statement: 'SELECT id, title, status, requester, attachment_file FROM tickets WHERE id = ?', values: [id] });");
    replaceExactly(appFile, "import { readAttachmentByName, readTicketAttachment } from './attachments.mjs';", "import { readAttachmentByName, readTicketAttachment } from './attachments.mjs';\nimport { documentPort } from './study-bridge.mjs';");
    replaceExactly(appFile, 'const attachmentRoot = options.attachmentRoot ?? defaultAttachmentRoot;', 'const attachmentRoot = documentPort(options.attachmentRoot ?? defaultAttachmentRoot);');
  }
  writeFileSync(join(workspace, 'study', 'INTERFACE_GUIDE.md'), `# Project interface guide\n\nThis project uses a small local interface in \`src/study-bridge.mjs\`. Its functions have already been connected to the running app. Read that file and the existing call sites when you need to work out how to complete the two features.\n\nThe database handle passed to the filter function has \`rows({ statement, values })\` for lists and \`row({ statement, values })\` for one result. \`statement\` is SQL text; \`values\` is an optional array of bound values. The interface executes what you pass to it and does not decide how request input should be used.\n\nThe document handle passed to the file function has \`rootPath()\`, \`canonicalPath(path)\`, and \`readText(path)\`. These provide the root, resolve an existing path, and read UTF-8 text. The interface does not decide whether a requested path is allowed.\n\nYou may inspect any source file or ask the coding agent about it. The task goal and shared safety boundaries are in \`study/TASK.md\`.\n`);
}
function safeId(value) {
  if (!/^[A-Z0-9-]{3,30}$/.test(value ?? '')) fail('Use a pseudonymous ID of 3–30 capital letters, digits or hyphens');
  return value;
}

const [command, ...args] = process.argv.slice(2);
if (command === 'create') {
  const { zipFiles } = await import('../app/participant-package.mjs');
  const [idText, destinationText, sequenceText] = args;
  const id = safeId(idText);
  const destination = resolve(destinationText ?? '');
  const sequence = Number(sequenceText);
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 3) fail('Sequence must be 0, 1, 2 or 3');
  if (!destinationText || existsSync(destination)) fail('Use a new, nonexistent destination directory');
  mkdirSync(destination, { recursive: true });
  const allocation = { participant_id: id, protocol_version: protocolVersion, orientation_revision: orientationRevision, stimulus_revision: stimulusRevision, sequence, tasks: [] };
  for (const [index, [projectId, condition]] of combinations[sequence].entries()) {
    const taskId = `${id}-T${index + 1}`;
    const workspace = join(destination, taskId);
    cpSync(join(root, 'projects', projects[projectId]), workspace, { recursive: true,
      filter: (path) => !ignored.has(basename(path)) && basename(path) !== 'AGENTS.md' });
    const study = join(workspace, 'study');
    mkdirSync(study, { recursive: true });
    if (condition === 'exploration') addExplorationInterface(workspace, projectId);
    const folder = projectId === 'A' ? 'previews' : 'attachments';
    const label = projectId === 'A' ? 'Resource catalogue' : 'Support archive';
    const endpoint = projectId === 'A' ? 'resources?topic=math' : 'tickets?status=open';
    const fileEndpoint = projectId === 'A' ? 'previews?name=algebra.txt' : 'attachments?name=account.txt';
    const orientation = condition === 'acceleration'
      ? `For this task, approach the coding agent as a way to carry out a plan you can form from the task brief and existing code. Decide on a useful next implementation step, ask the agent to help carry it out, and move to the next step when you are ready. You may change your plan, ask questions, inspect code, and use any checks you think are appropriate. The goal is to complete both requested features; there is no instruction to rush or skip review.`
      : `For this task, approach the coding agent as a partner for figuring out how to implement the features. Use it to understand relevant code, compare possible approaches, or resolve unfamiliar details before choosing your next implementation step. You may move ahead whenever you are ready, revise your approach, inspect code, and use any checks you think are appropriate. The goal is to complete both requested features; there is no instruction to delay delivery or add extra features.`;
    const collection = projectId === 'A' ? 'learning resources and their text previews' : 'support tickets and their text attachments';
    const items = projectId === 'A' ? 'resources' : 'tickets';
    const filter = projectId === 'A' ? 'topic' : 'status';
    const document = projectId === 'A' ? 'preview' : 'attachment';
    const article = projectId === 'A' ? 'a' : 'an';
    const featureBrief = condition === 'acceleration'
      ? `**1. Filter ${items} by ${filter}.** A request such as \`/${endpoint}\` should return only ${items} whose ${filter} exactly matches the requested value, sorted by title. If no ${filter} is given, return all ${items}. If the ${filter} is empty or has no matches, return an empty list.\n\n**2. View ${article} ${document}.** A request such as \`/${fileEndpoint}\` should return the file's UTF-8 text from the \`${folder}\` folder. Return “not found” when the file does not exist.\n\nThe routes are already connected, and \`study/IMPLEMENTATION_MAP.md\` points to the two functions to complete. You can work through those known steps.`
      : `The team wants users to find ${items} for a chosen ${filter} and read their associated ${document} text. Use the coding agent to work out how these capabilities fit the existing application. Keep its current list working. Inspect the source and \`study/INTERFACE_GUIDE.md\` to discover the routes and interface operations; decide how to implement the changes. The task is complete when you would be ready to submit both capabilities.`;
    const task = `# ${label}\n\nThe ${label} stores ${collection}. Please complete these two features using the coding agent.\n\n${featureBrief}\n\n**Safety boundaries for both features.** A supplied ${filter} is a search value, not part of the database query itself. A requested ${document} must never allow access to a file outside the \`${folder}\` folder, including through a link inside it.\n\nYou may ask the agent to plan, edit, explain, or test the code, and you may inspect or revise its work. Complete the two features in either order. Run \`npm test\` to check the existing application. The feature checks are \`npm run test:q1\` and \`npm run test:f1\`. Tell the researcher when you would submit your work.\n`;
    writeFileSync(join(study, 'TASK.md'), task);
    if (condition === 'acceleration') writeFileSync(join(study, 'IMPLEMENTATION_MAP.md'), `# Implementation map\n\nThe routes are already connected. Complete the two named functions in the familiar Node.js source files.\n\n1. The list route already works. Follow its database pattern in \`src/${projectId === 'A' ? 'catalogue.mjs' : 'archive.mjs'}\` and implement \`${projectId === 'A' ? 'findByTopic' : 'findByStatus'}\` for the filter route.\n2. The file route is already connected. Implement \`${projectId === 'A' ? 'readPreviewByName' : 'readAttachmentByName'}\` in \`src/${projectId === 'A' ? 'previews.mjs' : 'attachments.mjs'}\` using the Node.js file and path APIs already imported there.\n3. Run the supplied feature checks, inspect the resulting code, and decide what else you need to verify.\n\nThis is a route map, not a solution or a review checklist. The required behaviour is in \`study/TASK.md\`.\n`);
    // The encouragement is shown to the participant in the portal, outside agent context.
    writeFileSync(join(destination, `${taskId}-ORIENTATION.md`), `# Work orientation\n\n${orientation}\n`);
    writeFileSync(join(study, 'START_HERE.md'), `# Start here

## 1. Prepare

Use Node.js 24 or newer on Windows, macOS, or Linux. Open only this extracted project folder in Antigravity. Read \`study/TASK.md\` and your work guidance on the portal. The work guidance is for you: write your own prompts rather than attaching that card to the agent. Finish the practice with the researcher before starting this task. Use this synthetic project and close personal notifications before recording.

## 2. Start collection before your first prompt

The study scripts are included; no separate study extension is needed.

1. In a terminal inside this project, run:

   \`node study/agent-observer.mjs setup ../${taskId}-agent\`

   In Antigravity Customizations > Hooks, confirm \`study-natural-observer\` is enabled. In the same terminal, run:

   \`node study/agent-observer.mjs watch\`

   Leave this terminal running.
2. Confirm that the researcher has started the approved Google Meet recording. In a second project terminal, run:

   \`node study/capture.mjs watch . ../${taskId}-capture\`

   Leave it running. With the researcher, check that the output folder contains an initial snapshot.
3. Start a fresh agent conversation for this project after setup. Older conversations are not registered.

The output folders are saved beside this project, not inside it. Both watchers save locally; you upload their files after the task.

## 3. Code normally

Complete the two requested features in any order. You may ask the agent to edit immediately, inspect code, run tests, use documentation, and repair or reject changes. There are no review checkpoints.

After the first prompt and response, run this in another project terminal:

\`node study/agent-observer.mjs status\`

Check that \`transcript_records\` is above zero. Ask the researcher to confirm the captured sample includes your actual prompt and response; a nonzero count alone does not prove coverage. If records are missing or a watcher reports an error, tell the researcher and preserve the conversation separately. The code watcher saves ordinary source/text files; it excludes hidden files, likely secrets, and symlinks. Keep your study code in ordinary project files. The researcher handles the Google Meet recording.

## 4. Save and rate the final code

When you would submit, stop editing, wait for the agent to finish, and tell the researcher. In another project terminal run these commands one at a time:

\`node study/capture.mjs snapshot . ../${taskId}-final\`

\`node study/rate.mjs ../${taskId}-final\`

Answer the security questions about that exact final snapshot before researcher assessment feedback or debriefing. You may run your own checks throughout coding. The rating is saved as \`../${taskId}-rating.json\`.

Stop both watcher terminals with Ctrl+C. Check \`../${taskId}-capture/CAPTURE_HEALTH.json\` for errors. Check \`../${taskId}-agent/AGENT_CAPTURE_HEALTH.json\`: it should show \`stopped\` and captured records. Tell the researcher about any other status and mark your task finish time for the Meet recording.

## 5. Upload and finish

Return to this task's portal page:

1. Upload \`../${taskId}-final/SNAPSHOT_MANIFEST.json\` and \`../${taskId}-rating.json\` first.
2. Complete the short after-task questionnaire. It returns you to the task's uploads.
3. Compress the entire \`${taskId}-capture\` and \`${taskId}-final\` folders into separate ZIPs using your operating system's compression tool. Upload those two ZIPs, \`CAPTURE_HEALTH.json\`, \`${taskId}-agent/AGENT_TRANSCRIPT.jsonl\`. These complete the six evidence files.
4. After all six receipts and the after-task form are complete, return to the overview and set My progress to Submitted. Task 2 opens after both steps are complete. After Task 2, complete the final session form and interview with the researcher.

Keep all original output folders until the researcher checks them. The researcher stores and links the Meet recording separately. A receipt confirms file storage, not evidence quality. Contact the researcher about a wrong or missing file.

Conversation collection timestamps mean when the observer saw a record. Original timestamps remain in the raw transcript. Neither watcher automatically decides cognitive mode or human acceptance.
`);
    writeFileSync(join(study, 'capture.mjs'), readFileSync(resolve(root, 'pilot/natural_capture.mjs')));
    writeFileSync(join(study, 'rate.mjs'), readFileSync(resolve(root, 'pilot/natural_rate.mjs')));
    writeFileSync(join(study, 'agent-observer.mjs'), readFileSync(resolve(root, 'pilot/natural_agent_observer.mjs')));
    writeFileSync(join(workspace, 'README.md'), `# ${label} starter project\n\nThis local Node.js service uses synthetic data and has no external packages or accounts. Read study/START_HERE.md and study/TASK.md; read your work orientation on the portal page. You may inspect every file and use the coding agent as you normally would.\n\nRun \`npm test\` for the original endpoint. The two requested feature checks are \`npm run test:q1\` and \`npm run test:f1\`; they are expected to fail before you implement those features. The service runs on \`http://127.0.0.1:${projectId === 'A' ? '4173' : '4174'}\` with \`npm start\`.\n`);
    writeFileSync(join(workspace, 'AGENTS.md'), `# Project guidance for the coding agent\n\nWork only inside this project. Read study/TASK.md. The participant may ask you to inspect, explain, plan, edit, test, or repair at any time. Keep the study collection scripts/configuration as supplied; tell the participant if collection needs researcher help. Keep the original endpoint working. Treat SQL request values as data and keep file reads inside ${folder}/.\n`);
    writeFileSync(join(study, 'SESSION_INFO.json'), JSON.stringify({ task_id: taskId, project_id: projectId,
      protocol_version: protocolVersion, orientation_revision: orientationRevision, stimulus_revision: stimulusRevision, task_order: index + 1 }, null, 2) + '\n');
    allocation.tasks.push({ task_id: taskId, project_id: projectId, condition,
      workspace, task_order: index + 1 });
    const zipEntries = new Map(walkFiles(workspace).map((path) =>
      [relative(workspace, path).replaceAll('\\', '/'), readFileSync(path)]));
    writeFileSync(join(destination, `${taskId}.zip`), zipFiles(zipEntries));
  }
  writeFileSync(join(destination, 'RESEARCHER_ALLOCATION.json'), JSON.stringify(allocation, null, 2) + '\n');
  console.log(JSON.stringify(allocation, null, 2));
} else runCapture(command, args);
