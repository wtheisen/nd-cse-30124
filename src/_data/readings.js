/**
 * Generate reading data for pagination.
 *
 * Readings are sourced from the Assignments tab (type=reading, name matching
 * "Reading NN"). Each reading explicitly lists the schedule topic slugs it
 * covers via the Topics column — no more day-span inference.
 */
function prettifySlug(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

module.exports = async function() {
  const scheduleData = require('./schedule.js');
  const assignmentsData = require('./assignments.js');

  const schedule = await scheduleData();
  const assignments = await assignmentsData();

  // Build slug → topic display name map from the schedule
  const topicNameById = new Map();
  for (const unit of schedule) {
    if (!unit.days) continue;
    for (const day of unit.days) {
      if (day.topic_slug && day.topics && !topicNameById.has(day.topic_slug)) {
        topicNameById.set(day.topic_slug, day.topics);
      }
    }
  }

  const readings = [];
  for (const a of assignments) {
    const match = (a.name || '').match(/^Reading\s+(\d+)$/i);
    if (!match) continue;

    const num = parseInt(match[1], 10);
    const numberStr = String(num).padStart(2, '0');

    const topics = [];
    const topicSlugs = [];
    for (const slug of a.topics) {
      const topicName = topicNameById.get(slug) || prettifySlug(slug);
      topics.push(topicName);
      topicSlugs.push(slug);
    }

    const topicsStr = topics.length ? topics.join(' + ') : '';
    const title = topicsStr
      ? `Reading ${numberStr}: ${topicsStr}`
      : `Reading ${numberStr}`;

    readings.push({
      number: num,
      numberStr,
      title,
      readingDisplay: a.name,
      link: a.link || '',
      topics,
      topicSlugs
    });
  }

  readings.sort((a, b) => a.number - b.number);

  console.log(`[11ty] Found ${readings.length} readings: ${readings.map(r => r.number).join(', ')}`);
  return readings;
};
