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
      // HW03's released student notebook supersedes the legacy Drive link.
      link: num === 3
        ? 'https://colab.research.google.com/github/wtheisen/nd-cse-30124-homeworks/blob/main/homeworks/homework03/homework03.ipynb#copy=true'
        : a.link || '',
      previewBase: {
        1: 'https://williamtheisen.com/nd-cse-30124-homeworks/homeworks/homework01/homework01',
        2: 'https://williamtheisen.com/nd-cse-30124-homeworks/homeworks/homework02/homework02',
        3: 'https://williamtheisen.com/nd-cse-30124-homeworks/homeworks/homework03/homework03'
      }[num] || ''
    });
  }

  homeworks.sort((a, b) => a.number - b.number);

  console.log(`[11ty] Found ${homeworks.length} homeworks: ${homeworks.map(h => h.number).join(', ')}`);
  return homeworks;
};
