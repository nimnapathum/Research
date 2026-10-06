# Capture adapters: what they record

The local app's `configure-capture` command installs the [Antigravity PostToolUse hook](antigravity-hook.mjs) into a **participant-only workspace** and writes `study/CAPTURE_CONFIG.json`. The hook records selected agent tool metadata (file views/edits and test/scanner commands), conversation ID, step index, model name and the official transcript path when supplied. [Antigravity's hook schema](https://www.antigravity.google/docs/hooks/) documents these fields. The hook does **not** claim to capture every prompt, response, visible diff, or private reasoning. When the collector is unavailable, it appends fallback JSONL inside `.study-capture/` and returns `{}` so the agent can continue.

The [companion extension](extension/package.json) is source for a VS Code-compatible host. It records active file, save and file-system change events, plus test/scanner command hints when shell integration is available. It does not inspect the Antigravity extension's private chat. It records no keystroke content. A source event has actor `unknown` when the host cannot distinguish an agent edit from a participant edit. The extension was syntax-checked, but **installation and API behaviour in the chosen Antigravity setup remain a pilot gate**.

The controlled [checkpoint page](../app/README.md) is authoritative for candidate exposure, first keep/reject, exact snapshot confidence, and final repository hash. Consented screen video and the official Antigravity transcript must be attached separately for replay and prompt/response analysis. The researcher should align clocks with a visible session marker and mark any missing stream. [Antigravity's official hook documentation](https://www.antigravity.google/docs/hooks/) specifies PostToolUse stdin metadata and the transcript path; the [VS Code API](https://code.visualstudio.com/api/references/vscode-api) specifies editor/workspace and optional terminal shell events. Neither source guarantees complete cognitive-state or chat capture by a companion extension.

## Pilot checks

1. Open a packaged task workspace and confirm Antigravity loads `.agents/hooks.json` on the exact installed version.
2. Run one agent file edit and one `npm run test:q1`; inspect collector events or fallback JSONL.
3. If using the companion extension, verify editor focus/save events and whether shell integration fires in that host. Record the host and extension versions.
4. Confirm a prompt and visible response can be recovered from an official transcript or consented video. If not, mark them missing instead of reconstructing them as objective telemetry.
5. Confirm no unrelated files, account notifications, credentials or hidden model reasoning are in the export.
