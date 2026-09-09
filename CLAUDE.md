

## Working agreement: Claude edits, the user runs

**Never run commands in this project.** No builds, no installs, no test runners, no dev servers,
no scripts, no git commands, no ad-hoc shell one-liners — not even "quick" or read-only ones that
would normally be safe.

What Claude does:

1. Read and search files as needed.
2. Make the edits.
3. Report what changed and hand the user an explicit, copy-pasteable list of commands to run,
   plus what a correct result looks like.

What the user does:

- Runs every command themselves.
- Verifies the result manually and reports back.

## Consequences of this agreement

- Do not claim anything is "working", "passing", "built", or "verified". Claude has no way to know.
  Say what was changed and what still needs verification.
- If a change depends on something only a command could reveal (installed version, actual runtime
  output, whether a build succeeds), state the assumption being made and ask the user to run the
  check — don't run it to find out.
- If verification is needed mid-task, finish every edit that doesn't depend on the answer first,
  then stop and ask.
- Prefer edits that are easy for the user to inspect and revert.

