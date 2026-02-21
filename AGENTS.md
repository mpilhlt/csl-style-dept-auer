# Agent Instructions

This repository contains CSL (Citation Style Language) style files for Zotero, used by researchers at the Department Auer, Max Planck Institute for Legal History and Legal Theory.

## When a user asks you to change how citations or bibliography entries look

**Read these documents before making any changes:**

1. **[`docs/skill-csl-xml-structure.md`](docs/skill-csl-xml-structure.md)**
   Explains how CSL XML files are structured — elements, attributes, macros, variables, item types, and common editing patterns. Start here.

2. **[`docs/workflow-agent.md`](docs/workflow-agent.md)**
   Step-by-step workflow for handling user requests: how to identify the relevant section in the style file, make the edit, test it, and iterate.

3. **[`docs/csl-1.02-spec.rst`](docs/csl-1.02-spec.rst)**
   The full CSL 1.0.2 specification. Consult this for detailed questions about specific elements or attributes.

## Key files

| File | Purpose |
|---|---|
| `csl/juristische-zitierweise-mpilhlt-abt-auer.csl` | The CSL style file to edit |
| `data/examples.json` | CSL-JSON test data (19 example references) |
| `scripts/render.js` | Renders the style against the test data using citeproc-js |

## Testing your changes

After every edit to the CSL file, run the render script to verify the output:

```bash
node scripts/render.js                  # render citations + bibliography
node scripts/render.js --mode citations # footnotes only
node scripts/render.js --mode bibliography # bibliography only
node scripts/render.js --ids "http://zotero.org/groups/2711275/items/PSN5TLTD"  # specific item
```

Compare the output to what the user asked for. Iterate until it matches.

## GitHub issues

When asked to work on a GitHub issue, use `gh` if available. Add the example used in the issue to the example data to allow 1:1 comparisons of the test output. 

If there is a contradiction in what the issue wants with how the style currently handles things, and the current state is not clearly a bug, do not implement but add a comment that explains the discrepancy and asks for confirmation.

After making sure that the test output matches the desired end result, provide a summary of changes in the issue and close it. Provide information that the changes were made by a coding agent.
