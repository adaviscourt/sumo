# Claude Instructions

## Architecture constraints
- Data is JSON-backed — no database, no Prisma, no ORM
- Preserve existing quiz gameplay unless explicitly asked to change it
- Keep the scraper + import workflow working (`npm run scrape:rikishi && npm run import:rikishi`)

## Code style
- Keep changes focused and minimal — no unrelated refactors or cleanup
- Don't add comments or docstrings to code you didn't change

## CI
- `npm run test` and `npm run build` are the merge gates
- Do not run local test/build commands unless explicitly requested

## PR workflow
- PRs must include a closing keyword linking to the issue: `Closes #<number>`
- PR body should follow the existing pull request template
