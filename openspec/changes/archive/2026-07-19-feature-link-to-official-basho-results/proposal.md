## Why

Users need a direct path from Sumo Trainer to official Japan Sumo Association standings during an active honbasho. Today they must know or search for the official results page themselves.

## What Changes

- Add a site-wide banner at the top of the app only while a honbasho is active.
- Link the banner to the official JSA English honbasho results page at `https://www.sumo.or.jp/EnHonbashoMain`.
- Keep the banner hidden outside active tournament dates.
- Preserve existing quiz, auth, deck, and data refresh behavior.

## Capabilities

### New Capabilities

- `active-basho-results-banner`: Site-wide official results banner visibility and destination behavior for active basho periods.

### Modified Capabilities

- None.

## Impact

- Affected UI: root app layout/header area so the banner appears above site content.
- Affected logic: date-based active honbasho detection, using Japan-local tournament date ranges.
- Affected tests: coverage for active and inactive banner states plus date utility boundaries.
- External systems: outbound user navigation to the official JSA results page only; no required runtime dependency on JSA availability.
