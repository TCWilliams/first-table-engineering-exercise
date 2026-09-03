# Reflection

With more time I would:
- Change where the uniqueness guarantee lives. The current guard runs in memory in a single Node process and only persists while the server is alive, so I'd move it into a database  
- I would add automated testing. Manual testing against a written-down process was appropriate for the rapid prototype nature of this project.
- UI polish and styling, which was the first thing I cut when I ran over, following the cut order agreed with the agent before starting.
- I would use additional agent skills to refine and review code.

Where the agent 'failed': 
- Scope: Its first spec was well beyond a one-hour rapid prototype: a test framework, two test files and an extra API route I hadn't asked for, plus verification steps I wouldn't have time to run. I had it cut all of that, re-estimate, and break the work into ordered tasks with the low-value ones explicitly marked as cuttable. 

I verified the guard two ways: reading `claimFirstTable` to confirm no `await` sits between the availability check and the write, and a two-tab walkthrough where the second tab submits against a now-stale page, is told the table was just taken, and both tabs still show it booked after a hard refresh.

I didn't fix anything by hand, and that was deliberate rather than unnecessary. In normal work I'd have typed several of these changes myself, but I drove the agent to make them so the reasoning would show up in the transcript - returning a copy from `getRestaurants()`, a currency formatting fix, some destructuring, and rewording a filter count that read like pagination.

The design reasoning behind the guard is in `README.md`, and the full specification in `SPEC.md`.
