# Resource catalogue starter project

A tiny local API over 20 synthetic learning resources. There are no external packages, remote services, accounts, or real user data. The planned study runtime is Node.js 24.21.0 LTS; the candidate oracle suite has passed on that version.

## Run

~~~sh
npm start
~~~

The server listens on `http://127.0.0.1:4173` by default. Try `GET /health` and `GET /resources`. To check the starter project, run `npm test`.

The researcher will give you a separate task sheet for the requested feature. When you work on Q1, `npm run test:q1` checks ordinary feature behaviour. It is expected to fail before Q1 is implemented. You may inspect every file in this participant project and use other checks you think are useful.

The workspace guidance for the coding agent is in [AGENTS.md](AGENTS.md). The same security requirement appears in the participant task sheet.
