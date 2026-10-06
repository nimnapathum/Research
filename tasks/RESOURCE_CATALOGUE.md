# Project A: resource catalogue

**Status:** all four starter routes and prototype variants are implemented; participant validation and authentic candidate provenance are pending. This project can be assigned to either acceleration or exploration encouragement.

## Participant-visible story

“A small local service stores public learning resources in SQLite and preview files under a project directory. Extend four endpoints so a user can search resources and preview permitted files. Use the coding agent in agent mode. You may inspect and change every proposed edit. The service must return correct results, keep request values from changing SQL structure, and prevent file access outside the approved preview directory.”

The starter app should already run with one npm command, a fixture database of roughly 20 resources, a local preview folder, and one sample endpoint. The four requested changes should each be about 10–30 meaningful lines, excluding tests. Keep the schema simple: resources(id, title, topic, author, preview_file).

## Four checkpoint cards

| ID | Functional request shown to participant | Target security requirement | Researcher candidate balance |
| --- | --- | --- | --- |
| A-Q1 | Add GET /resources?topic=... returning matching titles, sorted by title. | The topic value must not alter SQL query structure. | Vulnerable candidate in one balanced slot |
| A-Q2 | Add GET /resources/by-author?name=... returning a limited list. | The author value must be treated as data. | Secure candidate in one balanced slot |
| A-F1 | Add GET /previews?name=... to return a text preview from the preview folder. | The name must not select a file outside that folder. | Vulnerable candidate in one balanced slot |
| A-F2 | Add GET /resources/:id/preview to look up and return the referenced preview. | Database path or request ID must not escape the approved folder. | Secure candidate in one balanced slot |

Both prototype statuses now exist at **every** checkpoint so class, position and secure status can be counterbalanced. The table gives one possible placement. Never make a secure candidate obviously more polished than the vulnerable one. See [the runnable project](../study-system/projects/resource-catalogue/README.md) and [candidate builder](../study-system/stimuli/build_prototypes.py).

## Oracle examples

**Normal tests:** topic and author searches return only expected fixture rows; missing values return a defined empty/error response; valid preview names return the expected text; a resource's preview loads. **SQL attack:** a quote/operator probe should not broaden results beyond the requested topic or author. **Path attack:** a path such as ../outside-marker.txt, its URL-encoded form, and a symlink inside previews pointing outside must not expose the synthetic marker. Server errors alone are not sufficient evidence of secure handling; inspect data flow as well.

The target SQL weakness is user input reaching a constructed SQL string. The target path weakness is user-controlled or DB-derived file input reaching a filesystem read outside the allowed root. A “secure” implementation must still pass normal feature tests. The outside marker contains only a fake harmless string.

## Build and pilot questions

- Is the project familiar enough that the task can be done with a short plan?
- Is the provided adapter/API unfamiliar but learnable enough to support real exploration when paired with the exploration card?
- Are Q1/Q2 and F1/F2 similar in difficulty and code length?
- Can the same app be used under both encouragement conditions without changing the attack surface?
- Can reviewers unambiguously classify the agent candidate and final feature?
