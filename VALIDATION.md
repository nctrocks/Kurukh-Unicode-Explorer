# Validation

The original application passed TypeScript checking and the production build. The bundled font was checked for cmap coverage of all 54 assigned Tolong Siki characters. Every assigned record was compared with UnicodeData.txt 17.0.0.

The following React DOM interaction checks passed in Happy DOM:

- Official repertoire: all 64 positions; 54 assigned; exactly ten expected gaps
- Click-to-copy writes a supplementary Tolong Siki character, not its label
- Unassigned slots inspect without copying or inserting
- Assignment filters show only 54 assigned entries
- Unassigned filter shows exactly ten gaps
- Case-insensitive code-point search
- Search official names
- Empty search has a recovery action
- Sample loads and computes code points separately from UTF-16 units
- Typing/pasting inspects supplementary characters, shared marks, whitespace and unassigned slots
- Copy text and code-point sequence preserve input order
- Insert character replaces selection and keeps a complete surrogate pair
- Clear resets inspector and disables empty copy actions
- Clipboard denial produces an honest failure message
- Unicode parser preserves lone-surrogate diagnosis
- Registered agent-tool schemas and annotations
- Agent-tool contract updates the same visible state and rejects invalid input
- Agent-tool registrations clean up on unmount

Browser visual QA and native browser WebMCP validation were unavailable. Agent-tool contract tests used a simulated page registry; they do not establish native browser support.

This export changes repository documentation and removes the original Site identity; application code is unchanged.
