# Feature Request: Show Kachi-Koshi image on high quiz scores

## Summary
Update the **Makuuchi Rikishi quiz results page** to display a specific **Kachi-Koshi** image when a user scores above 10 points.

## Motivation
A score above 10 in this quiz indicates strong performance. Showing a celebratory Kachi-Koshi visual for high scores improves feedback and reinforces the sumo theme.

## Proposed behavior
- On the results page, if `score > 10`, render the Kachi-Koshi image.
- If `score <= 10`, preserve the existing results UI behavior.

## Acceptance criteria
- [ ] Results page conditionally shows a Kachi-Koshi image for scores 11+
- [ ] Existing score display remains unchanged
- [ ] No gameplay logic changes to question flow or scoring
- [ ] Image has accessible `alt` text (e.g., `Kachi-Koshi celebration`)
- [ ] Works on mobile and desktop layouts

## Implementation notes
- Keep the change scoped to the results UI for the Makuuchi Rikishi quiz.
- Reuse existing image/asset conventions in the app.
- Avoid introducing backend/data model changes.

## Test plan
- [ ] Manually verify score paths for 10 and 11 points
- [ ] Confirm no regressions in other quiz result pages
