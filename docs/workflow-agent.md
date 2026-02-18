# Agent Workflow: Updating CSL Styles

This document describes the workflow for coding agents (e.g. Cline, GitHub Copilot, Cursor) to help non-technical users update the CSL citation style files in this repository.

---

## Overview

The workflow follows this cycle:

```
User describes desired change
        ↓
Agent reads the CSL style file
        ↓
Agent edits the CSL XML
        ↓
Agent runs: node scripts/render.js
        ↓
Agent compares output to user's expectation
        ↓
Repeat until output matches
```

---

## Prerequisites

- Node.js installed
- Dependencies installed: `npm install`
- Locale files present in `data/` (already included: `locales-de-DE.xml`, `locales-en-US.xml`)

---

## Step 1 — Understand the User's Request

Ask the user to describe:
1. **What type of reference** is affected (e.g. journal article, book, book chapter)?
2. **What should change** — provide a concrete before/after example if possible.
3. **Where** does the change apply — in footnote citations, in the bibliography, or both?

**Example user request:**
> "In footnotes, book citations should show the publisher place in parentheses after the year, like: *Stolleis*, Geschichte des öffentlichen Rechts, München (1999)."

---

## Step 2 — Read the Relevant Files

Read the CSL style file to understand the current formatting:

```
csl/juristische-zitierweise-mpilhlt-abt-auer.csl
```

Consult the skill document for CSL XML structure:
```
docs/skill-csl-xml-structure.md
```

For deep specification questions, consult:
```
docs/csl-1.02-spec.rst
```

---

## Step 3 — Identify the Relevant Section

In the CSL file, locate:

1. The `<citation>` element for footnote changes, or `<bibliography>` for reference list changes.
2. The `<if type="...">` block for the relevant item type (e.g. `book`, `article-journal`, `chapter`).
3. Any `<macro>` elements called from that block.

**Item types in this style:**
| Type | Used for |
|---|---|
| `article-journal` | Journal articles |
| `article-magazine` | Magazine articles with volume |
| `book` | Books (monographs, edited volumes) |
| `chapter` | Book chapters, Festschrift contributions |
| `entry-encyclopedia` | Encyclopedia / commentary entries |
| `legal_case` | Court decisions |
| `thesis` | Dissertations |
| `webpage` | Web pages |

---

## Step 4 — Make the Edit

Edit `csl/juristische-zitierweise-mpilhlt-abt-auer.csl` using the appropriate tool.

**Common patterns:**

### Add a variable to a citation
```xml
<!-- Before -->
<group delimiter=", ">
  <text macro="autor-editor-note"/>
  <text macro="inmonograph"/>
  <text macro="locator-with-label"/>
</group>

<!-- After: add publisher-place in parens after edition/year -->
<group delimiter=", ">
  <text macro="autor-editor-note"/>
  <text macro="inmonograph"/>
  <text variable="publisher-place" prefix="(" suffix=")"/>
  <text macro="locator-with-label"/>
</group>
```

### Change a delimiter
```xml
<!-- Before: slash-separated authors -->
<name form="short" delimiter="/"/>

<!-- After: comma-separated authors -->
<name form="short" delimiter=", "/>
```

### Add conditional logic
```xml
<choose>
  <if variable="publisher-place">
    <text variable="publisher-place" prefix="(" suffix=")"/>
  </if>
</choose>
```

---

## Step 5 — Test with the Render Script

Run the render script to see the output:

```bash
# Render everything (citations + bibliography)
node scripts/render.js

# Render only citations (footnotes)
node scripts/render.js --mode citations

# Render only bibliography
node scripts/render.js --mode bibliography

# Render specific items by ID
node scripts/render.js --ids "http://zotero.org/groups/2711275/items/PSN5TLTD"

# Get JSON output for programmatic comparison
node scripts/render.js --format json
```

**Item IDs in `data/examples.json`** (for targeted testing):

| ID suffix | Type | Description |
|---|---|---|
| `Q54MJZHY` | article-journal | Arndt, NJW 1963 |
| `VCCDGMNS` | article-journal | Bredt, JR 1926 |
| `NH7QIYVA` | article-journal | Ambrosius, ZögU 1980 |
| `6Q8N6V58` | article-journal | Ohly, AcP 2001 |
| `NNL3BW8U` | chapter | Esser in FS Hippel |
| `EFSIEU6J` | chapter | Liver, FG Liver |
| `6YEQN374` | book | FS Hippel (edited volume) |
| `LWXF7J65` | chapter | Haferkamp in HKK |
| `LVTSRXQI` | chapter | Arzt in Lutter/Stiefel/Hoeflich |
| `IFUJ53I4` | book | Alexander, Commodity and Propriety |
| `PSN5TLTD` | book | Stolleis, Bd. 1 |
| `9YH8M9J4` | book | Stolleis, Bd. 1 (2. Aufl., with URL) |
| `JG387DNA` | chapter | Coing in Gesammelte Aufsätze |
| `5YJ7UAQD` | book | Tiedeman (with original-date) |
| `UNRF2EAU` | chapter | Coing, § 138 in Staudinger |
| `U2NYQRIL` | book | Stolleis, Bd. 3 |
| `IBLZA4KM` | article-journal | Möllers, Der Staat 2004 |
| `EUMWU9UB` | article-journal | Friedrich, AöR 1977 |
| `7DIXLW2G` | book | Schmitt, 1950 |

---

## Step 6 — Compare Output to User Expectation

Show the rendered output to the user and ask:
- Does the citation format match what you expected?
- Is the punctuation correct?
- Are there any items that still look wrong?

If the output doesn't match, go back to Step 4 and refine the edit.

---

## Step 7 — Add Test Data if Needed

If the existing `data/examples.json` doesn't contain an item of the needed type, add a new CSL-JSON item to the array. The item must have:
- A unique `id` (use a URL-style string)
- A valid `type` (see CSL item types above)
- Relevant fields for the citation type

**Example — adding a thesis:**
```json
{
  "id": "test-thesis-001",
  "type": "thesis",
  "title": "Meine Dissertation",
  "author": [{"family": "Mustermann", "given": "Max"}],
  "publisher-place": "Frankfurt am Main",
  "genre": "Dissertation",
  "issued": {"date-parts": [["2020"]]}
}
```

Then test with:
```bash
node scripts/render.js --ids "test-thesis-001"
```

---

## Tips for Agents

### Validate XML before testing
The CSL file must be valid XML. After editing, check for:
- Unclosed tags
- Mismatched quotes in attribute values
- Invalid attribute names (refer to `docs/skill-csl-xml-structure.md`)

### The `<group>` suppression rule
A `<group>` produces no output if **all** its children produce no output. This is useful for conditional formatting — wrap optional fields in a `<group>` so that delimiters/prefixes don't appear when the field is empty.

### Macros are shared
Macros are used in both `<citation>` and `<bibliography>`. If you edit a macro, check that the change looks correct in both contexts. If you need different formatting in each, inline the logic directly instead of using the shared macro.

### The `near-note-distance="0"` setting
This style uses `near-note-distance="0"`, which means the "near-note" position is never triggered (distance 0 means only ibid applies). If you want to enable "short form after first citation" behavior, increase this value (e.g. `near-note-distance="5"`).

### Testing ibid behavior
To test ibid/near-note behavior, the render script processes citations sequentially as footnotes. Cite the same item twice in a row in `data/examples.json` (duplicate an entry with the same `id`) to see ibid output.

### Testing with locator types (page vs. column)

CSL supports different locator types for pinpoint references. The `label` field on a cite-item specifies the type (e.g., "page", "column", "chapter"). Common locator labels include:

| Label | German term | Use case |
|---|---|---|
| `page` | Seite (S.) | Default for most citations |
| `column` | Spalte (Sp.) | Used for some legal journals |
| `chapter` | Kapitel | Book chapters |
| `section` | Abschnitt | Document sections |
| `paragraph` | Absatz | Legal documents |
| `verse` | Vers | Religious texts |
| `line` | Zeile | Poetry, plays |

**Important:** The `label` field is for cite-items (individual citations with locators), not for the item's `page` field. The render script's `--label` flag can override the default "page" label for testing:

```bash
# Test citation with column locator instead of page
node scripts/render.js --ids "http://zotero.org/groups/2711275/items/Q54MJZHY" --label column

# Test with paragraph locator
node scripts/render.js --ids "http://zotero.org/groups/2711275/items/PSN5TLTD" --label paragraph
```

For bibliography entries that use column pagination (e.g., older legal journals), the item should include a marker. Use the `medium` field set to `"column"`:

```json
{
  "id": "weber-djz-1935",
  "type": "article-journal",
  "container-title": "Deutsche Juristen-Zeitung",
  "page": "659-665",
  "medium": "column",
  "title": "Eigentum und öffentliche Verwaltung im neuen Reich",
  "author": [{"family": "Weber", "given": "Werner"}],
  "issued": {"date-parts": [["1935"]]}
}
```

In the CSL style, check for the `medium` variable to decide between "S." and "Sp.":

```xml
<choose>
  <if variable="medium">
    <text term="column" form="short" suffix=" "/>
  </if>
  <else>
    <text term="page" form="short" suffix=" "/>
  </else>
</choose>
<text variable="page"/>
```
