# UI Design Choices

This document records front-end design decisions.

## Dialog Group/Tab Display (Configuration Panel)

`group` and `tab` are parsed unchanged from each parameter's `Dialog(...)` annotation (`setUIInfo` in `server/src/parser/parser.ts`) and flow through `TemplateInput`/`Option` as flat strings (see [linkage-schema.md](./linkage-schema.md#options)).
The front-end interprets them when building the display tree, in `_formatDisplayGroup` (`client/src/interpreter/display-option.ts`), and renders the result in `SlideOut.tsx`/`config-slide-out.scss`.

Design choices, matching how Modelica tools lay out the parameter dialog:

- **Declaration order across inheritance.** `option.options` lists a class's own parameters first, then inherited ones. Modelica tools instead show inherited parameters first, deepest base class first. `_formatDisplayGroup` re-sorts by declaring class (using `option.treeList`) before anything else, so every rule below operates on that corrected order.
- **Merging by group name.** Grouping is a stable partition over the already-sorted, flattened parameter list (parent and child class parameters mixed together), so parameters sharing a `Dialog(group=...)` name merge into one group regardless of which class in the hierarchy declares them.
- **Tabs as enclosing groups.** The UI has no tab widget, so a `Dialog(tab=...)` becomes a group that encloses its `Dialog(group=...)` children — a two-level nesting, never deeper.
- **Ungrouped parameters stay on top.** Parameters with no `Dialog` group/tab are rendered headerless, before any Dialog group, instead of being bucketed into Modelica's implicit `"Parameters"`/`"General"` default.
- **Composition groups never merge with Dialog groups.** A replaceable/composite component still gets its own group (named from the component description), even if its `Dialog(group=...)` name collides with another group's name — the two are kept as separate, differently-nested entries rather than merged.
- **Group position follows the first declaration, not the first *displayed* member.** A Dialog container is registered at the sorted position of the first parameter carrying that `group`/`tab`, even if that specific parameter ends up hidden (e.g. `final`-assigned in a derived class). Containers left with zero displayed items after this are pruned.

Dialog groups/tabs add a nesting level that composition groups didn't previously have, so they're styled deliberately lighter (`SlideOut.tsx`, `config-slide-out.scss`) to avoid a bloated parameter dialog:

- Composition groups keep a bordered box, unfilled: an early version gave it a background tint, but that mismatched when a composition group nested inside another one (the inner box's tint stacked on top of the outer one's).
- Dialog groups/tabs render frameless; only tabs indent their content (a group can never contain another group, so no indent is needed there).
- Composition group labels (component names) are capitalized, smaller, and not underlined, to read as visually distinct from Dialog group/tab labels, which are simply underlined.
- A group's label is suppressed entirely when its name is `"Configuration"`, or when it contains a single item. Composition groups and tabs always show their label. Suppressing the label also drops the container's own vertical margin, so removing the header doesn't leave extra gap between fields.
  - `"Configuration"` is the MBL template convention for the group of parameters meant to be set through ctrl-flow's config page, as opposed to e.g. simulation or sizing parameters. Since ctrl-flow only targets this set of parameters, the label distinguishes nothing and is dropped.
  - A single-item group's label is dropped because it's redundant: the parameter's own label already conveys the same information.
- The top-level composition group — the frame wrapping the template's own parameters (e.g. "Multiple-zone VAV") — is unwrapped entirely (`SlideOut.tsx`): its frame and label are redundant with the template name already shown in the config panel's header.
