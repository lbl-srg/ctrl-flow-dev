# Rules

These rules apply to every change to ctrl-flow, whether a person or an AI assistant makes it. AI assistants read this file first and follow it. If a rule blocks a task, stop and ask the maintainers. Do not work around the rule.

ctrl-flow is built on Modelica templates. Every value it stores, displays or exports is addressed by Modelica names. It is computed by applying Modelica semantics (MLS 3.7): name lookup, modifications, redeclarations, bindings, conditional declarations. A mistake in these rarely crashes anything. Instead it produces a plausible but wrong value, which is found much later in a generated document or an exported file. The rules below are meant to prevent that.

## 1. Specification first

- Write no code before the maintainers have reviewed and approved a specification in `docs/<feature>.md`. The model is [docs/selection-keys.md](docs/selection-keys.md).
- The specification has these sections:
  - **Motivation.**
  - **Grammar** of every name, key and file format the feature reads or writes (EBNF).
  - **Rules**, numbered, each Modelica rule citing its MLS section.
  - **Examples**, including edge cases.
  - **Out of scope.**
  - **Known limitations.**
  - **Acceptance criteria** that tests can verify.
- Implement the specification in small issues, each with tasks and acceptance criteria. Examples: #648, #649, #650.
- The specification is updated in the same PR as the code whenever implementation reveals something it missed.
- If the specification doesn't answer a question, ask the maintainers. The implementer does not decide it.

## 2. Boundaries

The **Modelica core** is changed by the maintainers only. Anyone else needs an issue the maintainers have approved, even for a one-line fix. The core is:

- `server/src/parser/`, which turns modelica-json into `client/src/data/templates.json`, and `server/scripts/parse-template-package.ts`;
- `client/src/interpreter/`: values, effective classes, resolution of element paths;
- `client/src/utils/selection-key.ts`, `client/src/utils/names.ts`, `server/src/parser/names.ts`;
- `server/scripts/ctrlflow/`: names, keys and payload for Python consumers;
- [docs/selection-keys.md](docs/selection-keys.md);
- the Modelica test fixtures in `server/tests/static-data/`.

**Consumers** turn the payload into a document or a file: the sequence document today, and XLS and DXF editing in the future. They use the core. They never reimplement it.

## 3. Read the payload, not Modelica

- A consumer gets values only from the payload, whose schema is in [docs/selection-keys.md](docs/selection-keys.md), "Payload". It loads the payload with `ctrlflow.payload`, calling `check_schema_version` first.
- A consumer never reads `.mo` files, modelica-json output or `templates.json` to compute a value. It never evaluates expressions, modifiers, bindings, `enable` conditions or conditional declarations. If a value it needs is missing from the payload, the payload is extended through a specification change.
- Read `value`. A `redeclare` is a class choice, not a value. Read the class of a replaceable component through its `typ` parameter where it has one.
- Values with `origin` `user` and `evaluated` are both values of the configuration.
- Merge values across configurations only if the specification of the feature says so. The sequence document merges them (one section per system type). An XLS of the values of each configuration must not.

## 4. Names and keys

- **No string operations on names or keys.** Never build, split, compare or normalize a key or a Modelica name with them: no `split(".")`, `split("-")`, regular expression, concatenation, case change or quote stripping. Use `ctrlflow.names` and `ctrlflow.keys` in Python, and `names.ts` and `selection-key.ts` in TypeScript. The reason: a quoted identifier (MLS §2.3.1) can contain `.`, `-`, spaces and escaped quotes, as in `'c-d'.'a.b'`.
- **Keys and option paths are different things.** A key is `<rootClass>-<elementPath>`, e.g. `Buildings.Templates.Data.AllSystems-sysUni`. An option's `modelicaPath` is a declaration path `<class>.<element>`, e.g. `Buildings.Templates.Data.AllSystems.sysUni`. Never convert one into the other by hand: the interpreter builds keys (resolution rules).
- **Compare identifiers only for equality.** Identifiers are kept as written, escapes included.
- **One key, one element.** A key identifies one element of one template. The same element path in two templates denotes two elements. Never key anything by the class that declares it: that was the cause of #620.

## 5. No shortcuts

The following are forbidden, whatever the deadline:

- **Fallbacks and heuristics** that guess when resolution fails: trying the enclosing class, dropping the last name, defaulting to the first option, etc. Fail loudly, with the name that didn't resolve. #639 removed such a fallback.
- **Special cases** in generic code for one template, parameter or library version. Template-specific knowledge belongs in data files, such as the mappings, and tests validate it (section 6).
- **Ignored errors.** Errors logged during tests or generation count as failures, so catching and ignoring them, or silencing a warning, is forbidden. Each logged error is either fixed or tracked in an issue. Ignored errors once hid sequence documents that showed both SI and IP equations, in the wrong order.
- **Expected outputs edited to make a test pass.** This covers golden files and generated fixtures. Regenerate them only when the specification predicts the change, and explain every difference in the PR.
- **Partial MLS support presented as complete.** List any unsupported Modelica construct under "Known limitations" in the specification. The code rejects it with an explicit error and never processes it silently. Example: the parser rejects quoted class identifiers.
- **Results that depend on test order, the environment or the machine.** Example: a fixture whose content depended on which library another test happened to convert first.

## 6. Data files are code

Source documents and mappings carry logic. Today these are the sequence document docx and the mappings CSV; future XLS and DXF templates will be too. For each such file:

- its syntax is specified (e.g. [docs/sequence-doc.md](docs/sequence-doc.md), "Annotations");
- tests check that it is well formed, and that every key it references is the key of an element with a value (e.g. `client/tests/sequence/mappings.test.ts`, `server/scripts/sequence-doc/tests/test_section_scope.py`);
- every edit is checked by generating the outputs of the golden payloads, with no error logged.

## 7. Tests

- **Small Modelica fixtures** in `server/tests/static-data` test every Modelica behavior, beyond what MBL templates exercise. They cover the edge cases of MLS: quoted identifiers, inheritance, redeclarations (including `final`), bindings to records, `outer` and `inner`, conditional declarations, enumerations, short classes. Each new case gets a fixture.
- **Golden tests are the regression baseline:** `client/tests/sequence/golden-payload.test.ts` and `server/scripts/sequence-doc/tests/test_golden.py`. A PR that changes their outputs without the explanation required in section 5 is rejected.
- **Independent tests:** each test sets up its own fixtures and doesn't depend on the order of tests.
- **The PR lists the tests** that verify each acceptance criterion.

## 8. Compatibility and versions

- **Payload changes:** the payload has a `schemaVersion`. A change to its structure or meaning updates the specification and bumps the schema version. All consumers are updated in the same PR. Consumers reject versions they don't support; the endpoint returns HTTP 400.
- **Breaking changes** to the stores or the payload need a version bump: minor while the version is 0.x (SemVer), in `client/package.json` and `server/package.json`. The PR makes the bump by hand, never the build.
- **Versions:** the MLS version is 3.7. The library versions are recorded in `meta.libraries` of the payload. Never hard-code them.

## 9. Instructions for AI assistants

[AGENTS.md](AGENTS.md) repeats these instructions and the Modelica core of section 2, because AI tools load it automatically (`CLAUDE.md` imports it for Claude Code). Update it together with this file.

- Read `RULES.md` and the specification of the feature before writing code.
- Don't modify the Modelica core (section 2). If the task seems to require it, stop and explain why.
- Don't implement Modelica semantics. For a Modelica question (lookup, modifications, redeclarations, quoted identifiers), cite the MLS 3.7 section and ask. Don't guess.
- Don't add fallbacks, heuristics, special cases or ignored errors. Don't edit expected outputs to make a test pass.
- Use the name and key modules. Never manipulate Modelica names or keys as strings.
- Report every test failure and every logged error as is.

## 10. Review checklist

The [pull request template](.github/pull_request_template.md) repeats this checklist, so that every PR includes it. Update it together with this file.

- [ ] The specification exists and is approved; the PR references it and the issue.
- [ ] The Modelica core is unchanged, or the change is approved by the maintainers.
- [ ] No string operation on names or keys.
- [ ] No fallback, heuristic, special case or ignored error.
- [ ] Golden outputs are unchanged, or each difference is predicted by the specification and explained.
- [ ] No error logged by the tests or by generating the outputs of the golden payloads.
- [ ] New Modelica edge cases are covered by fixtures.
- [ ] The version and the schema version are bumped if the stores or the payload change.
- [ ] The specification and the docs are updated.
