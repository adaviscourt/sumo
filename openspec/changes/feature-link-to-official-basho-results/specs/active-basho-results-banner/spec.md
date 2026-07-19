## ADDED Requirements

### Requirement: Active basho banner visibility
The system SHALL display an official results banner at the top of the site when the current Japan-local date falls within an active honbasho date range, inclusive of the first and final tournament days.

#### Scenario: Active tournament day
- **WHEN** the current Japan-local date is inside an active honbasho date range
- **THEN** the site displays the official results banner above the normal page content

#### Scenario: Inactive tournament day
- **WHEN** the current Japan-local date is outside all active honbasho date ranges
- **THEN** the site does not display the official results banner

#### Scenario: Tournament boundary days
- **WHEN** the current Japan-local date is the first or final day of an active honbasho date range
- **THEN** the site displays the official results banner

### Requirement: Official results navigation
The system SHALL make the active basho banner link to the official Japan Sumo Association English honbasho results page and label it as `Active Basho ({name})` followed by the banner icon and `Official JSA Results`, where `{name}` omits any trailing `basho` text to avoid duplication.

#### Scenario: User opens official results
- **WHEN** the active basho banner is displayed and the user activates it
- **THEN** the browser navigates to `https://www.sumo.or.jp/EnHonbashoMain`

#### Scenario: Active banner label
- **WHEN** the active basho banner is displayed for a named tournament
- **THEN** the banner text identifies the tournament as `Active Basho ({name})`, omits duplicate `basho` text inside the parentheses, and includes `Official JSA Results`

### Requirement: Site-wide placement
The system SHALL render the active basho banner from shared site chrome so it is available at the top of every app route while active.

#### Scenario: Non-home route during active tournament
- **WHEN** the current Japan-local date is inside an active honbasho date range and the user visits a non-home route
- **THEN** the official results banner appears above that route's normal content

### Requirement: Inviting banner treatment
The system SHALL style the active basho banner with an inviting treatment from the existing site palette, follow existing border and rounded-corner conventions, and avoid warning-style red emphasis.

#### Scenario: Active banner visual tone
- **WHEN** the active basho banner is displayed
- **THEN** the banner uses non-red site palette accents and existing border/radius styling suitable for a helpful live-link prompt
