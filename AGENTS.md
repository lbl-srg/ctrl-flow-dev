# Instructions for AI assistants

ctrl-flow is built on Modelica templates (MLS 3.7). A mistake in Modelica semantics rarely crashes anything. It produces a plausible but wrong value, which is found much later. Read [RULES.md](RULES.md) and the specification of the feature in `docs/` before writing code. These instructions repeat its sections 2 and 9; if they differ, `RULES.md` applies.

## Rules

- Write no code without a specification approved by the maintainers (`docs/<feature>.md`, modelled on [docs/selection-keys.md](docs/selection-keys.md)).
- Don't modify the Modelica core (below). If the task seems to require it, stop and explain why.
- Don't implement Modelica semantics. For a Modelica question (lookup, modifications, redeclarations, quoted identifiers), cite the MLS 3.7 section and ask. Don't guess.
- Consumers (sequence document, XLS, DXF) get values from the payload only, loaded with `ctrlflow.payload`. They never read `.mo` files, modelica-json output or `templates.json` to compute a value.
- Use the name and key modules (`ctrlflow.names`, `ctrlflow.keys`, `names.ts`, `selection-key.ts`). Never manipulate Modelica names or keys as strings (`split(".")`, `split("-")`, regular expressions, concatenation): quoted identifiers can contain `.` and `-`.
- Don't add fallbacks, heuristics, special cases for one template, or ignored errors. Don't edit expected outputs (golden files, fixtures) to make a test pass.
- Report every test failure and every logged error as is.

## Modelica core

Changed by the maintainers only:

- `server/src/parser/`, `server/scripts/parse-template-package.ts`
- `client/src/interpreter/`
- `client/src/utils/selection-key.ts`, `client/src/utils/names.ts`, `server/src/parser/names.ts`
- `server/scripts/ctrlflow/`
- `docs/selection-keys.md`
- `server/tests/static-data/`
