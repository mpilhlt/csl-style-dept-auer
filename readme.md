# CSL Style MPILHLT Dept. Auer

This is a collection of CSL templates for use at the department Marietta Auer at the Max Planck Institute for Legal History and Legal Theory.

Currently, it contains one style used by several researchers writing a German-language dissertation, which therefore follows citing conventions in German legal scholarship.

---

## Repository Structure

```
csl/                    CSL style files
  juristische-zitierweise-mpilhlt-abt-auer.csl   Main style file

data/                   Reference data and locale files
  examples.json         CSL-JSON test data (19 example references)
  locales-de-DE.xml     German locale for citeproc
  locales-en-US.xml     English locale for citeproc

docs/                   Documentation
  skill-csl-xml-structure.md   How CSL XML files work (for agents)
  workflow-agent.md            Step-by-step agent workflow
  csl-1.02-spec.rst            Full CSL 1.0.2 specification

scripts/
  render.js             Renders citations/bibliography using citeproc-js
```

---

## For Researchers: Requesting Style Changes

If you want to change how citations or bibliography entries are formatted, you can use a coding agent (e.g. Cline in VS Code) to make the changes for you.

**How to request a change:**

1. Open this repository in VS Code with the Cline extension.
2. Describe what you want to change in plain language. Be as specific as possible, ideally with a before/after example:

   > *"In footnotes, book citations currently show the year like `Stolleis, Geschichte, 1999`. I'd like the publisher place to appear before the year, like `Stolleis, Geschichte, München 1999`."*

3. The agent will read the style file, make the edit, test it using `node scripts/render.js`, and show you the output before finalizing.

The agent workflow is documented in [`docs/workflow-agent.md`](docs/workflow-agent.md).

---

## For Developers / Agents: Testing Style Changes

### Setup

```bash
npm install
```

### Render citations and bibliography

```bash
# Render both citations (footnotes) and bibliography
npm run render

# Render only footnote citations
npm run render:citations

# Render only bibliography
npm run render:bibliography

# Get JSON output (useful for programmatic comparison)
npm run render:json

# Or use the script directly with options
node scripts/render.js --help
node scripts/render.js --mode citations --ids "http://zotero.org/groups/2711275/items/PSN5TLTD"
```

### How the render script works

`scripts/render.js` uses [citeproc-js](https://github.com/Juris-M/citeproc-js) to process the CSL style against the test data in `data/examples.json`. It:

1. Loads the CSL style from `csl/`
2. Loads the German locale from `data/locales-de-DE.xml`
3. Renders all 19 example references as sequential footnote citations
4. Renders the full bibliography sorted by author/year
5. Outputs plain text (or JSON with `--format json`)

### Adding test data

To test a specific reference type not covered by `data/examples.json`, add a CSL-JSON object to that file and run:

```bash
node scripts/render.js --ids "your-item-id"
```

---

## Documentation

| File | Purpose |
|---|---|
| [`docs/skill-csl-xml-structure.md`](docs/skill-csl-xml-structure.md) | Explains CSL XML structure, elements, attributes, and common editing patterns |
| [`docs/workflow-agent.md`](docs/workflow-agent.md) | Step-by-step workflow for agents to handle user change requests |
| [`docs/csl-1.02-spec.rst`](docs/csl-1.02-spec.rst) | Full CSL 1.0.2 specification (reference) |

---

## License

The CSL style is licensed under [Creative Commons Attribution-ShareAlike 3.0](http://creativecommons.org/licenses/by-sa/3.0/).
