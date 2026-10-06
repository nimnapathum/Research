# Resource catalogue — checkpoint Q2

Add `GET /resources/by-author?name=...`. Return resources with that **exact** author name, sorted by title, with at most five results. Unknown or empty names return an empty list.

**Security requirement:** The `name` request value must remain data; it must not change the SQL query structure. You may inspect, test, question, revise, or reject the supplied proposal. Run `npm run test:q2` for ordinary feature behaviour.
