import { existsSync } from 'node:fs';

const eventData = (row) => JSON.parse(row.event_json);

export function measurementAudit(store) {
  const tasks = store.db.prepare('SELECT task_id,participant_id,project_id,condition,task_order,checkpoint_order_json,final_sha256 FROM tasks ORDER BY participant_id,task_order').all();
  return {
    generated_at_utc: new Date().toISOString(),
    tasks: tasks.map((task) => {
      const reviews = store.db.prepare('SELECT checkpoint_id,candidate_id,proposal_sha256,exposed_at,decision,confidence,decision_at FROM reviews WHERE task_id = ?').all(task.task_id);
      const skips = store.db.prepare('SELECT checkpoint_id,reason_code FROM skips WHERE task_id = ?').all(task.task_id);
      const events = store.db.prepare('SELECT event_json FROM events WHERE task_id = ? ORDER BY sequence').all(task.task_id).map(eventData);
      const evidence = store.db.prepare('SELECT kind,path,sha256 FROM evidence WHERE task_id = ?').all(task.task_id);
      const afterTask = store.db.prepare("SELECT 1 FROM forms WHERE task_id = ? AND kind = 'after_task'").get(task.task_id);
      const sourceCounts = {};
      const eventCounts = {};
      let captureLagMin = null;
      let captureLagMax = null;
      for (const event of events) {
        sourceCounts[event.source] = (sourceCounts[event.source] || 0) + 1;
        eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
        const captured = event.data?.capture_timestamp_utc;
        if (captured && Number.isFinite(Date.parse(captured))) {
          const lag = Date.parse(event.timestamp_utc) - Date.parse(captured);
          captureLagMin = captureLagMin === null ? lag : Math.min(captureLagMin, lag);
          captureLagMax = captureLagMax === null ? lag : Math.max(captureLagMax, lag);
        }
      }
      const sequence = JSON.parse(task.checkpoint_order_json);
      const byCheckpoint = sequence.map((id) => {
        const review = reviews.find((item) => item.checkpoint_id === id);
        const skip = skips.find((item) => item.checkpoint_id === id);
        const latency = review?.exposed_at && review?.decision_at
          ? Date.parse(review.decision_at) - Date.parse(review.exposed_at) : null;
        return {
          checkpoint_id: id, candidate_id: review?.candidate_id || null,
          exposed: Boolean(review?.exposed_at), decision: review?.decision || null,
          confidence_recorded: review?.confidence !== null && review?.confidence !== undefined,
          proposal_sha256: review?.proposal_sha256 || null,
          exposure_to_first_decision_ms: latency,
          skipped: skip?.reason_code || null
        };
      });
      const warnings = [];
      const optionalNotes = [];
      if (!task.final_sha256) warnings.push('missing_final_snapshot');
      if (!afterTask) warnings.push('missing_after_task_form');
      for (const row of byCheckpoint) {
        if (!row.exposed && !row.skipped) warnings.push(`${row.checkpoint_id}:not_exposed`);
        if (row.exposed && !row.decision && !row.skipped) warnings.push(`${row.checkpoint_id}:missing_first_decision`);
        if (row.decision && !row.confidence_recorded) warnings.push(`${row.checkpoint_id}:missing_confidence`);
        if (row.exposure_to_first_decision_ms !== null && row.exposure_to_first_decision_ms < 0) warnings.push(`${row.checkpoint_id}:negative_latency`);
      }
      const kindPresent = (kind) => evidence.some((item) => item.kind === kind && existsSync(item.path));
      if (!kindPresent('video')) warnings.push('video_not_attached');
      if (!kindPresent('agent-transcript')) warnings.push('agent_transcript_not_attached');
      if (!sourceCounts['antigravity-hook']) warnings.push('agent_hook_not_observed');
      if (!sourceCounts['pointer-recorder']) optionalNotes.push('pointer_not_observed_or_not_enabled');
      const pointer = events.filter((event) => event.event_type === 'pointer_summary');
      const pointerDurationMs = pointer.reduce((sum, event) => sum + (Number(event.data?.elapsed_ms) || 0), 0);
      const transcriptPaths = [...new Set(events.map((event) => event.data?.transcript_path).filter(Boolean))];
      return {
        task_id: task.task_id, participant_id: task.participant_id, project_id: task.project_id,
        condition: task.condition, task_order: task.task_order,
        checkpoints: byCheckpoint, final_snapshot_received: Boolean(task.final_sha256),
        source_counts: sourceCounts, event_counts: eventCounts,
        pointer_covered_ms: pointerDurationMs,
        capture_to_collector_lag_ms: captureLagMin === null ? null : { min: captureLagMin, max: captureLagMax },
        transcript_paths_reported_by_hook: transcriptPaths,
        evidence: evidence.map((item) => ({ kind: item.kind, sha256: item.sha256, file_present: existsSync(item.path) })),
        warnings, optional_notes: optionalNotes
      };
    })
  };
}
