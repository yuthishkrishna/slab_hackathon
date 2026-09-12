# SLAB Multi-Platform Agent

A local, read-only research, ticket, and career search console built with Node.js and Playwright. Each platform runs in its own browser page concurrently. Results are normalized, deduplicated, and returned with source health so a blocked or changed site does not stop the other searches.

## Run

```bash
npm install
npm run install:browsers
npm start
```

Open `http://localhost:3000` and use prompts such as:

- `Find tickets for Spider-Man near Bengaluru`
- `Find jobs for product designer`
- `Find research on human-AI collaboration`

## Architecture

- `index.js`: HTTP server, intent routing, browser lifecycle, and CLI entry point.
- `agents/multiPlatformAgent.js`: concurrent page orchestration and result merging.
- `agents/ticketAgent.js`: BookMyShow, District, Paytm Movies, and TicketsNew.
- `agents/jobAgent.js`: LinkedIn, Indeed, Naukri, and YC Companies.
- `agents/academicAgent.js`: arXiv, PubMed, and Crossref.
- `utils/platformCatalog.js`: platform URLs and selector candidates.
- `utils/platformSearch.js`: resilient navigation, extraction, and zero-result re-scouting.
- `utils/webcmdAdapter.js`: persistent selector memory under `memory/*_adapter.json`.
- `utils/safety.js`: terminal approval gate for any future booking-staging action.

The adapter follows the Webcmd self-learning model: cached selectors are reused first, live DOM evidence wins, and failed selectors are recorded for the next re-scout. The current app uses its installed Playwright runtime directly so it works without requiring a separate Webcmd CLI process. No checkout, payment, application submission, or external outreach is automated.

## Notes

LinkedIn, Indeed, ticketing sites, and other platforms may require login, rate-limit requests, or present anti-bot screens. Those sources are reported as unavailable or no-results while the remaining platforms continue. Respect each site's terms and use a human handoff for authentication or CAPTCHA.
