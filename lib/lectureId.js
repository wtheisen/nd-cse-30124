// The one rule for turning a schedule topic into the Resources sheet's lecture id ("lec-<slug>").
// It matches the Resources sheet's Exports formula (each run of non-alphanumerics becomes "-"), plus
// aliases for schedule topics whose wording differs from their Resources tab name.
// Used by the schedule table (.eleventy.js filters) and the missing-resources build warning.

const LECTURE_ALIASES = {
  'syllabus, history of ai': 'introduction',
  'intro to ai': 'introduction',
  'logistic regression and gradient descent': 'logistic-regression',
  'svms': 'support-vector-machines',
  'feed-forward networks': 'feedforward-neural-networks',
  'convolutional neural networks (cnns)': 'convolutional-neural-networks',
  'llms and agentic llms': 'llms-and-agents',
};

function lectureIdFor(topic) {
  if (!topic) return '';
  const key = String(topic).trim().toLowerCase();
  const slug = LECTURE_ALIASES[key] || key
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug ? `lec-${slug}` : '';
}

module.exports = { lectureIdFor, LECTURE_ALIASES };
