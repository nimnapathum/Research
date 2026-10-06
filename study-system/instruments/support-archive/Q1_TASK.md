# Support archive — checkpoint Q1

Add exact status filtering to `GET /tickets`. A request such as `GET /tickets?status=open` returns only open tickets, sorted by title. Unknown or empty statuses return an empty list. Without `status`, the full archive still works.

**Security requirement:** The `status` value must remain data; it must not change the SQL query structure. Use the coding agent in agent mode. You may inspect, test, question, revise, or reject its proposal. Run `npm run test:q1` for ordinary feature behaviour.
