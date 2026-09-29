# CSE 30124 — Introduction to Artificial Intelligence

Source for [the course website](https://30124.williamtheisen.com/), built with Eleventy. Assignment documents and schedule entries come from the published spreadsheets configured in `config.json`.

## Assignment publishing standard

Use this workflow for future homework, practice packet, and exam releases:

- Link the course schedule to a website landing page, rather than directly to a document. Use the existing reading/homework styling, theme support, and navigation.
- Homework notebook buttons should open a student copy in Colab (`#copy=true`). The homework data loader applies this to Colab links and converts Drive notebook links to Colab first. Keep the instructor's original as the source.
- Practice packet Google Docs should offer a **Make a copy** button (`/copy`) and a separate embedded document preview (`/preview`). The assessment data loader generates both automatically for new scheduled packets. PDFs can be previewed and downloaded; they do not support the Google Docs copy prompt.
- Include a readable embedded preview on each homework and practice packet landing page. For notebooks, generate and publish the student HTML previews in light and dark themes and register their base URL in `src/_data/homeworks.js`. Preview URLs are currently configured per homework; they are not generated automatically by this website.
- Include the correct Canvas submission link where applicable, and verify its deadline. Packet submission links are configured in `src/_data/assessments.js`; a new packet needs its own verified Canvas URL.
- Keep solutions in their own section on the landing page, with schedule solution links targeting `#solutions`. Solutions and exam review documents should open for reading, not force a student copy.
- Add exam documents and solutions to the assignment spreadsheet only when authorized for release after the exam. A populated link is treated as released; the website does not enforce release dates. Until then, the exam landing page shows an availability message.
- Before publishing, build with the current spreadsheet data, check the generated links, and verify the live landing page, copy prompt, preview, and submission destination. If a preview or submission link is not ready, report that explicitly rather than calling the release complete.

The shared templates apply these defaults to future assignments. Do not replace them with one-off direct-document schedule links.

## Development and deployment

Run `npm ci` and `npm run build`. Network access is needed to load the published course spreadsheets; check build output for fetch warnings. Generated files are written to `docs/`.

Changes pushed to `main` build and deploy through `.github/workflows/build.yaml`. Verify the deployment succeeds and inspect the live result.
