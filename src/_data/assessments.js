/** Landing pages for assessments in the current schedule, not archived sheet rows. */
module.exports = async function() {
  const [assignments, schedule] = await Promise.all([
    require('./assignments')(),
    require('./schedule')()
  ]);
  const byName = new Map(assignments.map(a => [a.name.toLowerCase(), a]));
  const pages = new Map();
  for (const section of schedule) {
    for (const day of section.days || []) {
      for (const name of [day.topics, ...(day.assignments || [])]) {
        const match = (name || '').match(/^(Practice Packet|Exam|Workbook)\s+(\d+)(?:\s+Solutions)?$/i);
        if (!match) continue;
        const kind = match[1].toLowerCase();
        const isWorkbook = kind === 'workbook';
        const isPractice = kind === 'practice packet';
        const number = match[2].padStart(2, '0');
        const title = `${isWorkbook ? 'Workbook' : isPractice ? 'Practice Packet' : 'Exam'} ${number}`;
        const slug = `${isWorkbook ? 'workbook' : isPractice ? 'practice_packet' : 'exam'}_${number}`;
        if (pages.has(slug)) continue;
        const link = byName.get(title.toLowerCase())?.link || '';
        const document = link.match(/^https:\/\/docs\.google\.com\/document\/d\/([A-Za-z0-9_-]+)/);
        const driveFile = link.match(/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
        const slides = link.match(/^https:\/\/docs\.google\.com\/presentation\/d\/([A-Za-z0-9_-]+)/);
        pages.set(slug, {
          title, slug, number, isPractice, isWorkbook,
          date: day.date,
          link,
          copyLink: isPractice && document
            ? `https://docs.google.com/document/d/${document[1]}/copy`
            : isWorkbook && slides ? `https://docs.google.com/presentation/d/${slides[1]}/copy` : '',
          pdfLink: slides ? `https://docs.google.com/presentation/d/${slides[1]}/export/pdf` : '',
          previewLink: document
            ? `https://docs.google.com/document/d/${document[1]}/preview`
            : driveFile ? `https://drive.google.com/file/d/${driveFile[1]}/preview`
            : slides ? `https://docs.google.com/presentation/d/${slides[1]}/embed?start=false&loop=false` : '',
          solutionsLink: byName.get(`${title.toLowerCase()} solutions`)?.link || '',
          relatedSlug: `${isPractice || isWorkbook ? 'exam' : 'practice_packet'}_${number}`,
          submissionLink: isPractice && number === '01'
            ? 'https://canvas.nd.edu/courses/143676/assignments/478064' : ''
        });
      }
    }
  }
  for (const page of pages.values()) {
    page.hasWorkbook = page.isPractice && pages.has(`workbook_${page.number}`);
  }
  return [...pages.values()];
};
