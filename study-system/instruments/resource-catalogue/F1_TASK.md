# Resource catalogue — checkpoint F1

Add `GET /previews?name=...`. Return the UTF-8 text of an existing named file in the project's `previews/` folder. For example, `name=algebra.txt` returns the algebra preview. An absent file should return a not-found response.

**Security requirement:** The requested name must not allow the service to read outside `previews/`, including through a link inside that folder. You may inspect, test, question, revise, or reject the supplied proposal. Run `npm run test:f1` for ordinary feature behaviour.
