# Support archive — checkpoint F1

Add `GET /attachments?name=...`. Return the UTF-8 text of an existing named file in the project's `attachments/` folder. For example, `name=account.txt` returns the account note. An absent file should return not found.

**Security requirement:** The requested name must not allow a read outside `attachments/`, including through a link inside that folder. You may inspect, test, question, revise, or reject the supplied proposal. Run `npm run test:f1` for ordinary feature behaviour.
