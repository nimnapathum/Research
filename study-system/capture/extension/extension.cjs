const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');

let statusBar;
let failedEvents = 0;

function findStudyWorkspace() {
  for (const folder of vscode.workspace.workspaceFolders || []) {
    const configPath = path.join(folder.uri.fsPath, 'study', 'CAPTURE_CONFIG.json');
    if (fs.existsSync(configPath)) {
      try { return { folder, config: JSON.parse(fs.readFileSync(configPath, 'utf8')) }; }
      catch { return null; }
    }
  }
  return null;
}

function relativeStudyPath(folder, uri) {
  if (!uri || uri.scheme !== 'file') return null;
  const rel = path.relative(folder.uri.fsPath, uri.fsPath);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) return null;
  if (rel.startsWith('.study-capture') || rel.startsWith('node_modules')) return null;
  return rel;
}

async function activate(context) {
  const study = findStudyWorkspace();
  if (!study) return;
  const { folder, config } = study;
  const fallback = path.join(folder.uri.fsPath, '.study-capture', 'extension-fallback.jsonl');
  fs.mkdirSync(path.dirname(fallback), { recursive: true });
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
  statusBar.text = 'Study capture: on';
  statusBar.command = 'studyCapture.status';
  statusBar.show();
  context.subscriptions.push(statusBar);

  async function record(event_type, data) {
    const payload = {
      token: config.token, task_id: config.task_id, source: 'companion-extension',
      actor: 'unknown', event_type, data
    };
    try {
      const response = await fetch(`${config.collector_url}/api/event`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2500)
      });
      if (!response.ok) throw new Error(`collector HTTP ${response.status}`);
    } catch (error) {
      failedEvents++;
      statusBar.text = `Study capture: ${failedEvents} queued`;
      fs.appendFileSync(fallback, JSON.stringify({ ...payload, token: undefined,
        timestamp_utc: new Date().toISOString(), capture_error: error.message }) + '\n');
    }
  }

  context.subscriptions.push(vscode.commands.registerCommand('studyCapture.status', () => {
    vscode.window.showInformationMessage(`Study capture is active for ${config.task_id}. ${failedEvents} events are queued locally.`);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('studyCapture.openReview', async () => {
    await vscode.env.openExternal(vscode.Uri.parse(config.collector_url));
  }));
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
    const rel = relativeStudyPath(folder, editor?.document.uri);
    if (rel) void record('file_viewed', { path: rel, channel: 'editor-focus' });
  }));
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((document) => {
    const rel = relativeStudyPath(folder, document.uri);
    if (rel) void record('file_saved', { path: rel, channel: 'editor-save' });
  }));
  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, 'src/**/*'));
  context.subscriptions.push(watcher);
  context.subscriptions.push(watcher.onDidChange((uri) => {
    const rel = relativeStudyPath(folder, uri);
    if (rel) void record('file_saved', { path: rel, channel: 'filesystem-change' });
  }));
  if (typeof vscode.window.onDidStartTerminalShellExecution === 'function') {
    context.subscriptions.push(vscode.window.onDidStartTerminalShellExecution((event) => {
      const command = String(event.execution.commandLine.value || '');
      let eventType = null;
      if (/\b(codeql|snyk|sonar|semgrep)\b|npm\s+audit/i.test(command)) eventType = 'scanner_run';
      else if (/\b(npm\s+(test|run\s+test)|node\s+--test|curl|wget)\b/i.test(command)) eventType = 'test_run';
      if (eventType) void record(eventType, {
        command_hint: command.replace(/--(token|key|password|secret)\s+\S+/gi, '--$1 [redacted]').slice(0, 200),
        command_confidence: event.execution.commandLine.confidence, channel: 'terminal-shell-integration'
      });
    }));
  }
}

function deactivate() { if (statusBar) statusBar.dispose(); }
module.exports = { activate, deactivate };
