## 1. Active Basho State

- [x] 1.1 Add a typed honbasho schedule source with date ranges and official results URL.
- [x] 1.2 Add a utility that determines active basho state from an injectable date using Japan-local calendar days.
- [x] 1.3 Add unit coverage for active, inactive, and first/final day boundary cases.

## 2. Banner UI

- [x] 2.1 Add a reusable top-of-site banner component or layout section that reads the active basho state.
- [x] 2.2 Link the banner to `https://www.sumo.or.jp/EnHonbashoMain` with external-link safety attributes.
- [x] 2.3 Ensure the banner appears above the normal header on all app routes and is absent outside active dates.
- [x] 2.4 Use an inviting site-palette banner treatment that avoids warning-style red emphasis.
- [x] 2.5 Align the banner treatment with existing border and rounded-corner conventions.

## 3. Verification

- [x] 3.1 Add or update layout/UI tests for active and inactive banner rendering.
- [x] 3.2 Run `npm run test`.
- [x] 3.3 Run `npm run build`.
- [x] 3.4 Run `openspec validate feature-link-to-official-basho-results --strict`.
