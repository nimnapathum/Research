# Project B: support archive

**Status:** all four starter routes and prototype variants are implemented; participant validation and authentic candidate provenance are pending. This project can be assigned to either encouragement condition.

## Participant-visible story

“A small helpdesk service stores synthetic support tickets in SQLite and attachments under a project directory. Add search and attachment access features with the coding agent. Review, test, change, or reject agent edits as you normally would. Search inputs must not change SQL structure, and attachment paths must remain in the approved attachments directory.”

Use the same Node version, framework, fixture size, dependency count, and test commands as Project A. The implemented schema is tickets(id, title, status, requester, attachment_file). It uses synthetic ticket text and harmless attachments.

## Four checkpoint cards

| ID | Functional request shown to participant | Target security requirement | Researcher candidate balance |
| --- | --- | --- | --- |
| B-Q1 | Add GET /tickets?status=... to filter and sort tickets. | Status is data, not SQL syntax. | Secure candidate in one balanced slot |
| B-Q2 | Add GET /tickets/by-requester?name=... returning matching tickets. | Requester input cannot change SQL query structure. | Vulnerable candidate in one balanced slot |
| B-F1 | Add GET /attachments?name=... to preview a local attachment. | Name cannot escape the attachments directory. | Secure candidate in one balanced slot |
| B-F2 | Add GET /tickets/:id/attachment using the stored attachment filename. | Stored or request-controlled paths cannot escape the attachments directory. | Vulnerable candidate in one balanced slot |

Both prototype statuses now exist at every checkpoint. The reversed placement relative to Project A is one possible schedule; actual candidate status and checkpoint order need counterbalancing. The final candidate set is locked only after matched-pair pilot review. See [the runnable project](../study-system/projects/support-archive/README.md) and [candidate builder](../study-system/stimuli/build_prototypes.py).

## Oracle examples

**Normal tests:** a valid status/customer returns expected tickets; a known attachment preview returns exact fixture content; missing records and missing files give specified errors. **SQL attack:** a crafted customer/status value must not broaden the result set or change query structure. **Path attack:** traversal and encoded traversal must not return the local outside-marker; symlink escape should also fail if symlinks are supported. Ensure no external file is actually sensitive.

The final adjudication reviews the source-to-sink path, because a particular attack test may fail for incidental reasons. Track a participant who rejects the candidate but later introduces a new variant of the same weakness.

## Build and pilot questions

- Does the helpdesk story feel comparable in difficulty to the resource catalogue?
- Are attachment paths and query filters equally visible to a participant?
- Does the exploration card make genuine option seeking possible without requiring specialized prior experience?
- Are the two projects distinct enough to reduce direct answer carry-over while still using comparable security mechanisms?
