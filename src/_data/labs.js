/**
 * Generate lab data for pagination.
 * Sourced from the Assignments tab (name matching "Lab NN").
 */
module.exports = async function() {
  const assignmentsData = require('./assignments.js');
  const assignments = await assignmentsData();

  const labs = [];
  for (const a of assignments) {
    const match = (a.name || '').match(/^Lab\s+(\d+)$/i);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    const numberStr = String(num).padStart(2, '0');

    labs.push({
      number: num,
      numberStr,
      assignmentName: `lab${numberStr}`,
      assignmentDisplay: a.name,
      link: a.link || ''
    });
  }

  labs.sort((a, b) => a.number - b.number);

  console.log(`[11ty] Found ${labs.length} labs: ${labs.map(l => l.number).join(', ')}`);
  return labs;
};
