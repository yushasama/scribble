# Typeset browser regression

Start `npm run dev`, then run `npm test`. Install Poppler or set `SCRIBBLE_PDFTOTEXT` to its pdftotext executable for text-extraction assertions. The suite uses the existing puppeteer-core and pdf-lib dependencies and an isolated headless Chrome profile. It never reads your editor state.

Set `SCRIBBLE_TEST_BROWSER` to a Chrome/Chromium executable and `SCRIBBLE_TEST_URL` when the dev server is not at localhost:5173. Generated screenshots, HTML and PDF go to node_modules/.tmp/typeset-tests, owned by the test configuration and already gitignored.

Checks cover Editorial prose indentation and exclusions, short heading denoters, links, background opacity, image-size shorthand, GFM tables, math, style selection, persistence, constrained preview width, standalone HTML typography, PDF page count and link annotations. External requests are blocked for reproducibility; this suite does not validate the externally loaded Mermaid runtime.

PDF checks use Chromium native printing of the same HTML passed to the print frame, verify extracted prose and all six Ping flags, preserve unlabeled fences, and check print invocation and cleanup without opening a real dialog. Browser Save as PDF is the user-facing export flow.
