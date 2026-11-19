const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const fetchCsv = require('../../lib/fetchCsv.js');

let cachedAssignments = null;
let inFlightAssignments = null;

/**
 * Load assignments from the Assignments tab CSV.
 * Returns: [ { id, name, type, link, primary, topics: [slug, ...] }, ... ]
 * The `topics` field holds schedule `id` slugs (semicolon-delimited in the sheet)
 * that the assignment covers — used by readings to enumerate topic sections.
 */

function normalizeHeaders(headers) {
  return headers.map(h => h.trim().toLowerCase().replace(/ /g, '_'));
}

function bestOf(row, ...candidates) {
  for (const c of candidates) {
    if (row[c] && row[c].trim()) return row[c].trim();
  }
  return '';
}

function toBool(s) {
  if (!s) return false;
  s = s.trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'required'].includes(s);
}

function stripLeadingBlankLines(text) {
  const lines = text.split(/\r?\n/);
  let start = 0;
  while (start < lines.length && /^[,\s]*$/.test(lines[start])) start++;
  return lines.slice(start).join('\n');
}

function loadAssignmentsFromCSV(text) {
  const records = parse(stripLeadingBlankLines(text), {
    columns: (headers) => normalizeHeaders(headers),
    skip_empty_lines: true,
    trim: true
  });

  const out = [];
  for (const row of records) {
    const id = bestOf(row, 'id');
    const name = bestOf(row, 'name');
    const type = bestOf(row, 'type');
    const link = bestOf(row, 'link', 'url', 'href');
    const primary = toBool(bestOf(row, 'primary', 'is_primary'));
    const topicsStr = bestOf(row, 'topics');

    if (!id && !name) continue;

    const topics = topicsStr
      ? topicsStr.split(';').map(t => t.trim()).filter(Boolean)
      : [];

    out.push({ id, name, type, link, primary, topics });
  }

  console.log(`[11ty] CSV assignments: rows=${out.length}`);
  return out;
}

async function loadAssignments() {
  const configPath = path.join(process.cwd(), 'config.json');
  let assignmentsUrl = '';

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assignmentsUrl = config.csv_urls?.assignments || '';
  } catch (err) {
    console.error('Warning: Could not read config.json:', err.message);
  }

  const localCsvPath = path.join(process.cwd(), 'static', 'csv', 'assignments.csv');

  try {
    if (fs.existsSync(localCsvPath)) {
      const csvText = fs.readFileSync(localCsvPath, 'utf8');
      return loadAssignmentsFromCSV(csvText);
    }
  } catch (err) {
    console.error('Warning: Could not read local assignments.csv:', err.message);
  }

  if (assignmentsUrl) {
    const csvText = await fetchCsv(assignmentsUrl);
    return loadAssignmentsFromCSV(csvText);
  }

  console.warn('Warning: No assignments data available');
  return [];
}

// Homeworks, labs, readings and assessments all load this; fetch the sheet once per build.
// A failed or empty fetch fails the build rather than publishing pages with no assignments.
module.exports = async function() {
  if (cachedAssignments) return cachedAssignments;

  if (!inFlightAssignments) {
    inFlightAssignments = loadAssignments()
      .then(assignments => {
        if (!assignments.length) {
          throw new Error('Assignments data source returned no rows');
        }
        cachedAssignments = assignments;
        return assignments;
      })
      .finally(() => {
        inFlightAssignments = null;
      });
  }

  return inFlightAssignments;
};
