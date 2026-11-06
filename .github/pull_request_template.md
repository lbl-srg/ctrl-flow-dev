### Description
<!-- Add a short description of the PR. Each functional change should have it's own listing -->

### Related Issue(s) and Specification
<!-- Link related issues here, and the specification in docs/<feature>.md -->

### Testing
<!-- List the tests that verify each acceptance criterion. Explain every difference in the golden outputs -->

### Review Checklist
<!-- From RULES.md, section 10. See RULES.md for the details of each item -->

- [ ] The specification exists and is approved; the PR references it and the issue.
- [ ] The Modelica core is unchanged, or the change is approved by the maintainers.
- [ ] No string operation on names or keys.
- [ ] No fallback, heuristic, special case or ignored error.
- [ ] Golden outputs are unchanged, or each difference is predicted by the specification and explained.
- [ ] No error logged by the tests or by generating the outputs of the golden payloads.
- [ ] New Modelica edge cases are covered by fixtures.
- [ ] The version and the schema version are bumped if the stores or the payload change.
- [ ] The specification and the docs are updated.
