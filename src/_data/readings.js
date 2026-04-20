/**
 * Generate reading data for pagination
 * Returns an array of reading objects with associated topics
 *
 * Each reading includes topics from its due date through all following days
 * until the next reading, excluding cancelled topics.
 */
const fs = require('fs');
const path = require('path');

module.exports = async function() {
  // Import schedule data
  const scheduleData = require('./schedule.js');
  const schedule = await scheduleData();

  // Load cancelled days from config
  let cancelledTopics = [];
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    cancelledTopics = config.cancelled_days || [];
  } catch (err) {
    console.error('Warning: Could not read config.json for cancelled_days:', err.message);
  }

  // Flatten all days into a single chronological list
  const allDays = [];
  for (const unit of schedule) {
    if (!unit.days) continue;
    for (const day of unit.days) {
      allDays.push(day);
    }
  }

  // Find which days have reading assignments and extract reading numbers
  const readingDayIndices = []; // Array of { index, readingNum }
  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];
    if (!day.assignments) continue;
    for (const assignment of day.assignments) {
      const match = assignment.match(/reading\s*(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        readingDayIndices.push({ index: i, readingNum: num });
      }
    }
  }

  // Sort by reading number to handle any out-of-order assignments
  readingDayIndices.sort((a, b) => a.readingNum - b.readingNum);

  // Each reading covers the two upcoming lectures starting on its due date,
  // skipping cancelled days and review/exam days (which aren't lecture topics).
  const TOPICS_PER_READING = 2;
  const nonLecturePatterns = ['review', 'exam'];

  const readingsMap = new Map();

  for (const { index: startIdx, readingNum } of readingDayIndices) {
    const topics = [];
    const topicSlugs = [];

    for (let i = startIdx; i < allDays.length && topics.length < TOPICS_PER_READING; i++) {
      const day = allDays[i];
      if (!day.topics) continue;

      const topicLower = day.topics.toLowerCase();

      const isCancelled = cancelledTopics.some(c => topicLower.includes(c.toLowerCase()));
      if (isCancelled) continue;

      const isNonLecture = nonLecturePatterns.some(p => topicLower.includes(p));
      if (isNonLecture) continue;

      if (!topics.includes(day.topics)) {
        topics.push(day.topics);
        if (day.topic_slug) {
          topicSlugs.push(day.topic_slug);
        }
      }
    }

    readingsMap.set(readingNum, {
      number: readingNum,
      numberStr: String(readingNum).padStart(2, '0'),
      topics,
      topicSlugs
    });
  }

  // Convert to sorted array and add display properties
  const readings = Array.from(readingsMap.values())
    .sort((a, b) => a.number - b.number)
    .map(reading => {
      const topicsStr = reading.topics.length > 0
        ? reading.topics.join(' + ')
        : '';
      const title = topicsStr
        ? `Reading ${reading.numberStr}: ${topicsStr}`
        : `Reading ${reading.numberStr}`;

      return {
        ...reading,
        title,
        readingDisplay: `Reading ${reading.numberStr}`
      };
    });

  console.log(`[11ty] Found ${readings.length} readings: ${readings.map(r => r.number).join(', ')}`);

  return readings;
};
