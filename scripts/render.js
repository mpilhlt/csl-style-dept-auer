#!/usr/bin/env node
// @ts-check
/**
 * CSL Style Rendering Workflow
 *
 * Uses citeproc-js to render citations and bibliography entries from
 * CSL-JSON data using a CSL style file. Designed to be used by coding
 * agents to verify that style changes produce the expected output.
 *
 * Usage:
 *   node scripts/render.js [options]
 *
 * Options:
 *   --style <path>     Path to CSL style file (default: csl/juristische-zitierweise-mpilhlt-abt-auer.csl)
 *   --data <path>      Path to CSL-JSON data file (default: data/examples.json)
 *   --locales-dir <p>  Directory containing locales-xx-XX.xml files (default: data)
 *   --mode <mode>      Output mode: "citations", "bibliography", or "both" (default: "both")
 *   --ids <id,...>     Comma-separated list of item IDs to render (default: all)
 *   --format <fmt>     Output format: "text" or "json" (default: "text")
 *   --help             Show this help message
 *
 * Examples:
 *   node scripts/render.js
 *   node scripts/render.js --mode citations
 *   node scripts/render.js --mode bibliography
 *   node scripts/render.js --ids "http://zotero.org/groups/2711275/items/Q54MJZHY"
 *   node scripts/render.js --format json
 */

'use strict';

const fs = require('fs');
const path = require('path');
/** @type {any} */
const CSL = require('citeproc');

// ── Type definitions ──────────────────────────────────────────────────────────

/**
 * @typedef {'citations' | 'bibliography' | 'both'} RenderMode
 * @typedef {'text' | 'json'} OutputFormat
 */

/**
 * @typedef {Object} CliArgs
 * @property {string}   style       - Path to CSL style file
 * @property {string}   data        - Path to CSL-JSON data file
 * @property {string}   localesDir  - Directory containing locale XML files
 * @property {RenderMode} mode      - What to render
 * @property {string[] | null} ids  - Item IDs to render (null = all)
 * @property {OutputFormat} format  - Output format
 * @property {boolean}  help        - Show help and exit
 */

/**
 * @typedef {Object} CslItem
 * @property {string} id
 * @property {string} type
 * @property {string} [title]
 * @property {Array<{family: string, given: string}>} [author]
 * @property {Array<{family: string, given: string}>} [editor]
 * @property {{ 'date-parts': Array<Array<string|number>> }} [issued]
 * @property {string} [container-title]
 * @property {string} [publisher]
 * @property {string} [publisher-place]
 * @property {string} [page]
 * @property {string} [volume]
 * @property {string} [edition]
 * @property {string} [URL]
 */

/**
 * @typedef {Object} CitationEntry
 * @property {number} index     - Footnote number (1-based)
 * @property {string} id        - CSL item ID
 * @property {string} type      - CSL item type
 * @property {string} title     - Item title
 * @property {string} citation  - Rendered citation text
 */

/**
 * @typedef {Object} BibliographyEntry
 * @property {string} id    - CSL item ID
 * @property {string} text  - Rendered bibliography text
 */

/**
 * @typedef {Object} RenderResult
 * @property {string}  style      - Path to style file used
 * @property {string}  data       - Path to data file used
 * @property {string}  locale     - Locale tag detected from style
 * @property {number}  itemCount  - Number of items rendered
 * @property {CitationEntry[]}  citations    - Rendered citations (empty if mode=bibliography)
 * @property {{ entries: BibliographyEntry[] } | null} bibliography - Rendered bibliography
 */

/**
 * @typedef {Object} RenderOptions
 * @property {string}         stylePath   - Path to CSL style file
 * @property {string}         dataPath    - Path to CSL-JSON data file
 * @property {string}         localesDir  - Directory containing locale XML files
 * @property {RenderMode}     mode        - What to render
 * @property {string[] | null} filterIds  - Item IDs to render (null = all)
 */

/**
 * @typedef {Object} CslSys
 * @property {(lang: string) => string} retrieveLocale
 * @property {(id: string) => CslItem | undefined} retrieveItem
 */

// ── Argument parsing ──────────────────────────────────────────────────────────

/**
 * Parse command-line arguments.
 * @param {string[]} argv - process.argv
 * @returns {CliArgs}
 */
function parseArgs(argv) {
  /** @type {CliArgs} */
  const args = {
    style: 'csl/juristische-zitierweise-mpilhlt-abt-auer.csl',
    data: 'data/examples.json',
    localesDir: 'data',
    mode: 'both',
    ids: null,
    format: 'text',
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--style':       args.style = argv[++i]; break;
      case '--data':        args.data = argv[++i]; break;
      case '--locales-dir': args.localesDir = argv[++i]; break;
      case '--mode':        args.mode = /** @type {RenderMode} */ (argv[++i]); break;
      case '--ids':         args.ids = argv[++i].split(',').map(/** @param {string} s */ s => s.trim()); break;
      case '--format':      args.format = /** @type {OutputFormat} */ (argv[++i]); break;
      case '--help':
      case '-h':            args.help = true; break;
      default:
        console.error(`Unknown argument: ${argv[i]}`);
        process.exit(1);
    }
  }
  return args;
}

// ── Locale loading ────────────────────────────────────────────────────────────

/**
 * Load a locale XML file from the locales directory.
 * Falls back to en-US if the requested locale is not found.
 *
 * @param {string} localesDir - Directory containing locales-xx-XX.xml files
 * @param {string | null} lang - BCP 47 language tag (e.g. "de-DE", "de", "en-US")
 * @returns {string | null} Locale XML string, or null if not found
 */
function loadLocale(localesDir, lang) {
  /** @type {string[]} */
  const candidates = [];

  if (lang) {
    candidates.push(lang);
    // Try with region: "de" -> "de-DE"
    if (!lang.includes('-')) {
      /** @type {Record<string, string>} */
      const regionMap = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', it: 'it-IT', es: 'es-ES' };
      if (regionMap[lang]) candidates.push(regionMap[lang]);
    }
  }
  candidates.push('en-US'); // final fallback

  for (const candidate of candidates) {
    const filePath = path.join(localesDir, `locales-${candidate}.xml`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  }
  return null;
}

// ── Strip HTML tags from citeproc output ──────────────────────────────────────

/**
 * Strip HTML tags and decode common HTML entities from a citeproc output string.
 * @param {string} html - Raw HTML string from citeproc
 * @returns {string} Plain text
 */
function stripHtml(html) {
  return html
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x2013;/g, '–')
    .replace(/&#x2014;/g, '—')
    .replace(/&#160;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// ── Main rendering function ───────────────────────────────────────────────────

/**
 * Render citations and/or bibliography using citeproc-js.
 * @param {RenderOptions} options
 * @returns {RenderResult}
 */
function renderCitations(options) {
  const { stylePath, dataPath, localesDir, mode, filterIds } = options;

  // Load CSL style
  if (!fs.existsSync(stylePath)) {
    throw new Error(`Style file not found: ${stylePath}`);
  }
  const styleXml = fs.readFileSync(stylePath, 'utf-8');

  // Load CSL-JSON data
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found: ${dataPath}`);
  }
  /** @type {CslItem[]} */
  const items = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Build item map
  /** @type {Record<string, CslItem>} */
  const itemMap = {};
  for (const item of items) {
    itemMap[item.id] = item;
  }

  // Determine which IDs to render
  const allIds = Object.keys(itemMap);
  const renderIds = filterIds
    ? filterIds.filter(id => {
        if (!itemMap[id]) { console.warn(`Warning: item ID not found: ${id}`); return false; }
        return true;
      })
    : allIds;

  if (renderIds.length === 0) {
    throw new Error('No items to render.');
  }

  // Detect style locale from XML
  const localeMatch = styleXml.match(/default-locale="([^"]+)"/);
  const styleLocale = localeMatch ? localeMatch[1] : 'en-US';

  // citeproc sys object
  /** @type {CslSys} */
  const sys = {
    retrieveLocale(lang) {
      return loadLocale(localesDir, lang) || loadLocale(localesDir, styleLocale) || '';
    },
    retrieveItem(id) {
      return itemMap[id];
    },
  };

  // Initialize citeproc engine
  const engine = new CSL.Engine(sys, styleXml);

  /** @type {RenderResult} */
  const result = {
    style: stylePath,
    data: dataPath,
    locale: styleLocale,
    itemCount: renderIds.length,
    citations: [],
    bibliography: null,
  };

  // ── Render bibliography ─────────────────────────────────────────────────────
  if (mode === 'bibliography' || mode === 'both') {
    engine.updateItems(renderIds);
    /** @type {[{ entry_ids: string[][], maxoffset: number }, string[]]} */
    const [bibMeta, bibEntries] = engine.makeBibliography();

    result.bibliography = {
      entries: bibEntries.map((/** @type {string} */ html, /** @type {number} */ i) => ({
        id: bibMeta.entry_ids[i][0],
        text: stripHtml(html),
      })),
    };
  }

  // ── Render citations ────────────────────────────────────────────────────────
  if (mode === 'citations' || mode === 'both') {
    // Re-initialize engine for citation processing (fresh state)
    const engine2 = new CSL.Engine(sys, styleXml);
    engine2.updateItems(renderIds);

    // Process each item as a separate citation (simulates footnotes in sequence)
    /** @type {string[]} */
    const processedCitationIds = [];

    for (let i = 0; i < renderIds.length; i++) {
      const id = renderIds[i];
      const item = itemMap[id];

      try {
        const citationId = `cit-${i}`;

        /** @type {[number, Array<[number, string, string]>]} */
        const [, updatedCitations] = engine2.processCitationCluster(
          {
            citationID: citationId,
            citationItems: [{ id }],
            properties: { noteIndex: i + 1 },
          },
          processedCitationIds.map((cid, j) => [cid, j + 1]),
          []
        );

        processedCitationIds.push(citationId);

        // Find the output for the current citation (last entry is always the most recent)
        const citEntry = updatedCitations.find(
          (/** @type {[number, string, string]} */ [, , cid]) => cid === citationId
        ) || updatedCitations[updatedCitations.length - 1];

        const citText = citEntry ? stripHtml(citEntry[1]) : '';

        result.citations.push({
          index: i + 1,
          id,
          type: item.type,
          title: item.title || '(no title)',
          citation: citText,
        });
      } catch (err) {
        result.citations.push({
          index: i + 1,
          id,
          type: item.type,
          title: item.title || '(no title)',
          citation: `[ERROR: ${err instanceof Error ? err.message : String(err)}]`,
        });
      }
    }
  }

  return result;
}

// ── Output formatting ─────────────────────────────────────────────────────────

/**
 * Print a render result as human-readable text to stdout.
 * @param {RenderResult} result
 * @returns {void}
 */
function printText(result) {
  const hr  = '─'.repeat(70);
  const hr2 = '═'.repeat(70);

  console.log(hr2);
  console.log('  CSL Style Render Output');
  console.log(`  Style:  ${result.style}`);
  console.log(`  Data:   ${result.data}`);
  console.log(`  Locale: ${result.locale}  |  Items: ${result.itemCount}`);
  console.log(hr2);

  if (result.citations.length > 0) {
    console.log('\n  CITATIONS (simulated as sequential footnotes)\n' + hr);
    for (const c of result.citations) {
      console.log(`\n  [${c.index}] [${c.type}] ${c.title}`);
      console.log(`       ${c.citation}`);
    }
  }

  if (result.bibliography && result.bibliography.entries.length > 0) {
    console.log('\n\n  BIBLIOGRAPHY\n' + hr);
    for (const entry of result.bibliography.entries) {
      console.log(`\n  • ${entry.text}`);
    }
  }

  console.log('\n' + hr2 + '\n');
}

// ── Entry point ───────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(`
CSL Style Renderer — scripts/render.js

Renders citations and bibliography entries using citeproc-js.
Use this to verify that CSL style changes produce the expected output.

Usage:
  node scripts/render.js [options]

Options:
  --style <path>      CSL style file
                      (default: csl/juristische-zitierweise-mpilhlt-abt-auer.csl)
  --data <path>       CSL-JSON data file (default: data/examples.json)
  --locales-dir <p>   Directory with locales-xx-XX.xml files (default: data)
  --mode <mode>       "citations", "bibliography", or "both" (default: "both")
  --ids <id,...>      Comma-separated item IDs to render (default: all)
  --format <fmt>      "text" or "json" (default: "text")
  --help              Show this help

Examples:
  node scripts/render.js
  node scripts/render.js --mode bibliography
  node scripts/render.js --mode citations
  node scripts/render.js --ids "http://zotero.org/groups/2711275/items/Q54MJZHY"
  node scripts/render.js --format json
`);
    process.exit(0);
  }

  try {
    const result = renderCitations({
      stylePath:  args.style,
      dataPath:   args.data,
      localesDir: args.localesDir,
      mode:       args.mode,
      filterIds:  args.ids,
    });

    if (args.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printText(result);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
