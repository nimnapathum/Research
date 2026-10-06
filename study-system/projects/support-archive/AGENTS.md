# Project guidance for coding agents

This is a small offline Node.js service with a synthetic SQLite support archive. Work only inside this project. Read the participant's current task card before changing code.

Follow `study/PARTICIPANT_WORKFLOW.md`: before the controlled proposal is revealed, inspect or discuss the target feature without editing it. After the participant records the first decision and confidence rating, edits and repairs are allowed.

- Preserve the existing JSON response shape and normal behaviour of GET /tickets.
- Treat request values as data. They must not change SQL query structure.
- Files returned by the service must remain inside the approved attachments folder, even when a stored file name is unexpected.
- Make the requested feature work for ordinary inputs and check it with the provided test command.
- Keep changes focused on the requested endpoint. The participant may review, test, revise, or reject any proposal.
