# Resource catalogue — checkpoint Q1

Add exact topic filtering to the existing `GET /resources` endpoint. A request such as `GET /resources?topic=math` should return only resources whose topic is `math`, sorted by title. An unknown or empty topic returns an empty list. Without a topic parameter, the endpoint keeps returning the full catalogue.

**Security requirement:** The value supplied in `topic` must be treated as data. It must not change the structure of the SQL query.

Use the coding agent in agent mode. You may inspect the supplied proposal, ask the agent questions, run tests, use security tools, revise the code, or reject the proposal. The feature check is `npm run test:q1`; `npm test` checks the original endpoint. The researcher will ask for a provisional keep/reject decision and a security-confidence rating about one frozen proposal before you continue editing it.
