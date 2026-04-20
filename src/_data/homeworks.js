/**
 * Generate homework data for pagination.
 * Sourced from the Assignments tab (name matching "Homework NN").
 */
module.exports = async function() {
  const assignmentsData = require('./assignments.js');
  const assignments = await assignmentsData();

  const homeworks = [];
  for (const a of assignments) {
    const match = (a.name || '').match(/^Homework\s+(\d+)$/i);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    const numberStr = String(num).padStart(2, '0');

    homeworks.push({
      number: num,
      numberStr,
      assignmentName: `homework${numberStr}`,
      assignmentDisplay: a.name,
      link: a.link || ''
    });
  }

  homeworks.sort((a, b) => a.number - b.number);

  console.log(`[11ty] Found ${homeworks.length} homeworks: ${homeworks.map(h => h.number).join(', ')}`);
  return homeworks;
};
