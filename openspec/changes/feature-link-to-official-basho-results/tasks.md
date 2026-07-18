## 1. Active Basho State

- [ ] 1.1 Add a typed honbasho schedule source with date ranges and official results URL.
- [ ] 1.2 Add a utility that determines active basho state from an injectable date using Japan-local calendar days.
- [ ] 1.3 Add unit coverage for active, inactive, and first/final day boundary cases.

## 2. Banner UI

- [ ] 2.1 Add a reusable top-of-site banner component or layout section that reads the active basho state.
- [ ] 2.2 Link the banner to `https://www.sumo.or.jp/EnHonbashoMain` with external-link safety attributes.
- [ ] 2.3 Ensure the banner appears above the normal header on all app routes and is absent outside active dates.

## 3. Verification

- [ ] 3.1 Add or update layout/UI tests for active and inactive banner rendering.
- [ ] 3.2 Run `npm run test`.
- [ ] 3.3 Run `npm run build`.
- [ ] 3.4 Run `openspec validate feature-link-to-official-basho-results --strict`.
