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

## Design Context

### Users
Curious newcomers to professional sumo — approachable, welcoming, not intimidating. The app is a friendly guide, not an exam.

### Brand Personality
**Calm. Authentic. Welcoming.** Like a dojo, not a classroom.

### Aesthetic Direction
**Zen / wabi-sabi.** Light mode only. The existing palette is already well-suited (rice/ink/navy/clay/pine/gold). Japanese flair through sparse kanji/hiragana used structurally — a single 相撲 as a header accent, 始める alongside "Start" — never tourist-trap ornament. No gradients, no heavy shadows, no gloss. Matte and natural, like ink on paper.

**Anti-references**: No cherry-blossom clipart, red-sun clichés, or lantern/sushi imagery.

### Design Principles
1. **Breathing room is the design** — whitespace is intentional, not leftover
2. **Ink over plastic** — matte surfaces, subtle borders, no gloss
3. **One Japanese element that earns its place** — kanji/hiragana used structurally, not scattered as decoration
4. **Approachable depth** — cultural richness revealed progressively
5. **Restraint as craft** — remove until the design can't be simplified further without losing meaning
