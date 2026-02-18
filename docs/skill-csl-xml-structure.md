# Skill: Understanding and Editing CSL Style Files

## What is CSL?

The **Citation Style Language (CSL)** is an open XML-based format for describing how citations, footnotes, and bibliographies should be formatted. Zotero, Mendeley, and other reference managers use CSL styles to render references.

The full specification is available in this repository at [`docs/csl-1.02-spec.rst`](./csl-1.02-spec.rst).

---

## File Structure Overview

A CSL file is an XML document with the `.csl` extension. Its root element is `<style>` in the namespace `http://purl.org/net/xbiblio/csl`.

```xml
<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" version="1.0" class="note" default-locale="de-DE">
  <info> ... </info>
  <locale> ... </locale>   <!-- optional -->
  <macro name="..."> ... </macro>  <!-- zero or more -->
  <citation> ... </citation>
  <bibliography> ... </bibliography>
</style>
```

### Top-level `<style>` attributes

| Attribute | Description |
|---|---|
| `class` | `"in-text"` (author-date, numeric) or `"note"` (footnote/endnote) |
| `version` | Always `"1.0"` |
| `default-locale` | BCP 47 language tag, e.g. `"de-DE"`, `"en-US"` |
| `demote-non-dropping-particle` | How to handle particles like "von" in sorting |

---

## `<info>` — Style Metadata

Contains descriptive metadata about the style. Not used for rendering.

```xml
<info>
  <title>My Style</title>
  <id>http://www.zotero.org/styles/my-style</id>
  <link href="http://www.zotero.org/styles/my-style" rel="self"/>
  <link href="http://www.zotero.org/styles/apa" rel="template"/>
  <contributor><name>Author Name</name></contributor>
  <category citation-format="note"/>
  <category field="law"/>
  <updated>2024-01-01T00:00:00+00:00</updated>
  <rights license="http://creativecommons.org/licenses/by-sa/3.0/"/>
</info>
```

---

## `<locale>` — Localization Overrides

Overrides default locale terms (labels, date formats). Optional.

```xml
<locale xml:lang="de">
  <terms>
    <term name="accessed">besucht am</term>
    <term name="editor" form="short">
      <single>Hrsg.</single>
      <multiple>Hrsg.</multiple>
    </term>
  </terms>
</locale>
```

Common term names: `"accessed"`, `"editor"`, `"translator"`, `"edition"`, `"volume"`, `"page"`, `"in"`, `"ibid"`, etc.

---

## `<macro>` — Reusable Formatting Blocks

Macros are named, reusable formatting blocks called from `<citation>`, `<bibliography>`, or other macros via `<text macro="name"/>`.

```xml
<macro name="author">
  <names variable="author">
    <name delimiter=" / " name-as-sort-order="all"/>
    <label form="short" prefix=" (" suffix=")"/>
    <substitute>
      <names variable="editor"/>
      <text variable="title"/>
    </substitute>
  </names>
</macro>
```

---

## `<citation>` — Footnote / In-text Citation Formatting

Defines how citations appear in footnotes or inline.

```xml
<citation near-note-distance="5">
  <sort>
    <key variable="issued" sort="descending"/>
  </sort>
  <layout delimiter="; " suffix=".">
    <!-- formatting logic here -->
  </layout>
</citation>
```

Key attributes on `<citation>`:
- `near-note-distance` — how many notes back counts as "near" (for ibid/near-note logic)
- `disambiguate-add-year-suffix`, `disambiguate-add-names`, `disambiguate-add-givenname`

---

## `<bibliography>` — Reference List Formatting

Defines how entries appear in the bibliography/reference list.

```xml
<bibliography subsequent-author-substitute="ders." entry-spacing="1">
  <sort>
    <key macro="author"/>
    <key variable="issued"/>
  </sort>
  <layout suffix=".">
    <!-- formatting logic here -->
  </layout>
</bibliography>
```

---

## Core Rendering Elements

### `<text>` — Output text

```xml
<text variable="title"/>              <!-- output a variable -->
<text macro="author"/>                <!-- call a macro -->
<text value="in: "/>                  <!-- literal string -->
<text term="editor" form="short"/>    <!-- localized term -->
```

Attributes: `prefix`, `suffix`, `font-style` (`italic`/`normal`), `font-weight` (`bold`/`normal`), `text-case` (`uppercase`/`lowercase`/`capitalize-first`/`title`), `strip-periods`, `quotes`, `display`.

### `<number>` — Numeric output

```xml
<number variable="edition" form="ordinal"/>   <!-- "2nd" -->
<number variable="volume" form="numeric"/>    <!-- "3" -->
<number variable="edition" form="roman"/>     <!-- "ii" -->
```

### `<date>` — Date output

```xml
<date variable="issued" form="text" date-parts="year"/>
<date variable="issued">
  <date-part name="day" suffix=". "/>
  <date-part name="month" form="long" suffix=" "/>
  <date-part name="year"/>
</date>
```

### `<names>` — Author/editor names

```xml
<names variable="author editor" delimiter=", ">
  <name form="long" delimiter=" / " name-as-sort-order="all"
        et-al-min="4" et-al-use-first="1"/>
  <et-al term="et-al" font-style="italic"/>
  <label form="short" prefix=" (" suffix=")"/>
  <substitute>
    <names variable="editor"/>
    <text variable="title"/>
  </substitute>
</names>
```

`<name>` attributes:
- `form`: `"long"` (full name) or `"short"` (family name only)
- `name-as-sort-order`: `"all"` or `"first"` — puts family name first
- `delimiter`: separator between names (e.g. `" / "`, `", "`)
- `initialize-with`: e.g. `"."` to use initials
- `et-al-min` / `et-al-use-first`: when to truncate with "et al."
- `sort-separator`: separator between family and given name in sort order

### `<group>` — Grouping with delimiter

Groups elements together. If all child elements produce no output, the group itself produces no output (suppresses orphaned delimiters/prefixes).

```xml
<group delimiter=", ">
  <text variable="publisher-place"/>
  <date variable="issued" form="text" date-parts="year"/>
</group>
```

### `<choose>` — Conditional logic

```xml
<choose>
  <if type="article-journal">
    <text variable="container-title"/>
  </if>
  <else-if type="book chapter" match="any">
    <text variable="publisher"/>
  </else-if>
  <else>
    <text variable="title"/>
  </else>
</choose>
```

`<if>` / `<else-if>` test attributes:
- `type`: item type(s), space-separated (e.g. `"book chapter"`)
- `variable`: true if variable is non-empty
- `is-numeric`: true if variable is numeric
- `is-uncertain-date`: true if date is uncertain
- `position`: `"first"`, `"subsequent"`, `"ibid"`, `"ibid-with-locator"`, `"near-note"`
- `match`: `"all"` (default), `"any"`, `"none"`

---

## Item Types

Common CSL item types used in this style:

| Type | Description |
|---|---|
| `article-journal` | Journal article |
| `article-magazine` | Magazine article |
| `book` | Book |
| `chapter` | Book chapter |
| `entry-encyclopedia` | Encyclopedia entry |
| `legal_case` | Court case |
| `thesis` | Dissertation/thesis |
| `webpage` | Web page |

---

## Common Variables

### Standard variables

| Variable | Description |
|---|---|
| `title` | Full title |
| `title-short` | Short title / abbreviation |
| `container-title` | Journal/book title containing the item |
| `publisher` | Publisher name |
| `publisher-place` | Place of publication |
| `page` | Page range (e.g. `"123-145"`) |
| `page-first` | First page only |
| `volume` | Volume number |
| `issue` | Issue number |
| `edition` | Edition number |
| `URL` | URL |
| `DOI` | DOI |
| `note` | Free-text note field |
| `locator` | Locator in citation (page, paragraph, etc.) |
| `first-reference-note-number` | Footnote number of first citation |

### Name variables

`author`, `editor`, `translator`, `collection-editor`, `composer`, `director`, `interviewer`, `illustrator`, `original-author`, `recipient`, `reviewed-author`, `series-creator`

### Date variables

`issued`, `accessed`, `original-date`, `submitted`, `event-date`

### Number variables

`chapter-number`, `citation-number`, `collection-number`, `edition`, `first-reference-note-number`, `issue`, `locator`, `number`, `number-of-pages`, `number-of-volumes`, `page`, `page-first`, `volume`

---

## Position-based Logic (for note styles)

In `class="note"` styles, citations can detect their position:

| Position | Meaning |
|---|---|
| `first` | First time this source is cited |
| `subsequent` | Any later citation |
| `ibid` | Immediately preceding citation is the same source |
| `ibid-with-locator` | ibid but with a different locator |
| `near-note` | Within `near-note-distance` footnotes of the first citation |

Example pattern used in this style:
```xml
<choose>
  <if position="ibid">
    <text value="ebd."/>
  </if>
  <else-if position="near-note">
    <text value="Fn." prefix="["/>
    <text variable="first-reference-note-number" suffix="]"/>
  </else-if>
  <else>
    <!-- full citation -->
  </else>
</choose>
```

---

## Workflow for Editing This Style

1. **Identify the item type** you want to change (e.g. `article-journal`, `book`, `chapter`).
2. **Find the relevant `<if type="...">` block** in `<citation>` or `<bibliography>`.
3. **Identify the macro** being called (e.g. `<text macro="author-note"/>`).
4. **Edit the macro or the inline block** to change formatting.
5. **Test** using the workflow described in [`docs/workflow-agent.md`](./workflow-agent.md).

### Key macros in this style

| Macro | Purpose |
|---|---|
| `author` | Full author name for bibliography |
| `author-note` | Short author name for citations |
| `autor-editor-note` | Short author or editor for citations |
| `edition` | Edition + year formatting |
| `inarticle` | Journal container + year |
| `inmonograph` | Book title + edition |
| `inmagazine` | Magazine title + volume + year |
| `locator-with-label` | Locator with symbol prefix |
| `firstpage-locator` | First page + locator in parens |
| `URL` | URL (only if `note` field is set) |

---

## Tips for Common Changes

### Change the delimiter between authors
Find the `<name>` element in the relevant macro and change its `delimiter` attribute:
```xml
<name delimiter=" / " .../>   <!-- current: " / " -->
<name delimiter=", " .../>    <!-- change to: ", " -->
```

### Change how edition numbers appear
Find the `edition` macro and modify the `<number>` element:
```xml
<number variable="edition" form="ordinal"/>  <!-- "2nd" -->
<number variable="edition" form="numeric"/>  <!-- "2" -->
```

### Add a field to a citation type
Inside the `<if type="book">` block in `<citation>`, add a `<text>` element:
```xml
<text variable="publisher-place" prefix="(" suffix=")"/>
```

### Change punctuation between citation parts
Modify the `delimiter` attribute on the enclosing `<group>`:
```xml
<group delimiter=", ">  <!-- comma-separated -->
<group delimiter=" ">   <!-- space-separated -->
```
