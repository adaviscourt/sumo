## ADDED Requirements

### Requirement: Ordered rikishi bonus sequence
The system SHALL present two ordered bonus questions after a user correctly identifies a Makuuchi Rikishi card: the existing rank-family bonus first and the signature-maneuver bonus second.

#### Scenario: Correct rikishi answer starts rank-family bonus
- **WHEN** a user correctly answers a Makuuchi Rikishi card
- **THEN** the system displays the rank-family bonus before any signature-maneuver bonus

#### Scenario: Rank-family bonus advances to signature maneuver
- **WHEN** a user submits an answer for the rank-family bonus
- **THEN** the system displays the signature-maneuver bonus for the same rikishi before allowing the user to continue to the next card or results

#### Scenario: Incorrect rikishi answer has no bonuses
- **WHEN** a user incorrectly answers a Makuuchi Rikishi card
- **THEN** the system does not display rank-family or signature-maneuver bonus questions for that card

### Requirement: Independent bonus attempts
The system SHALL treat each rikishi bonus question as an independent opportunity, so an incorrect answer to one bonus MUST NOT prevent the user from answering the other bonus.

#### Scenario: Incorrect rank-family answer still permits signature maneuver
- **WHEN** a user answers the rank-family bonus incorrectly
- **THEN** the system still displays the signature-maneuver bonus for the same rikishi

#### Scenario: Bonus scoring is independent
- **WHEN** a user answers one rikishi bonus correctly and the other rikishi bonus incorrectly
- **THEN** the system awards credit only for the correct bonus and records each bonus result separately

### Requirement: Signature maneuver content
The system SHALL build the signature-maneuver bonus from official rikishi profile data and kimarite deck content, including the romanized kimarite term, Japanese characters, and summary text.

#### Scenario: Signature maneuver prompt choices
- **WHEN** a signature-maneuver bonus is displayed
- **THEN** the system presents the correct kimarite term with distractor kimarite choices from the kimarite deck

#### Scenario: Signature maneuver feedback details
- **WHEN** a user submits a signature-maneuver bonus answer
- **THEN** the system shows whether the bonus was correct and reveals the correct romanized kimarite term, Japanese characters, and summary text

#### Scenario: Bonus feedback is grouped by question
- **WHEN** a user completes the rikishi bonus sequence for a card
- **THEN** the score summary associates each bonus result with its bonus question and correct answer

#### Scenario: Missing signature maneuver content
- **WHEN** a rikishi card lacks usable signature-maneuver data or the maneuver cannot be matched to kimarite deck content
- **THEN** the system MUST NOT display an empty signature-maneuver bonus and MUST keep the rank-family bonus and main-card flow usable

### Requirement: Rikishi profile data enrichment
The scraper and import workflow SHALL preserve signature maneuver data from official rikishi profiles in the generated rikishi dataset without removing existing required fields.

#### Scenario: Scraper extracts signature maneuver
- **WHEN** `npm run scrape:rikishi` parses a Makuuchi rikishi profile that includes signature maneuver data
- **THEN** the raw snapshot includes that signature maneuver value for the rikishi

#### Scenario: Import preserves signature maneuver
- **WHEN** `npm run import:rikishi` processes a raw snapshot containing signature maneuver values
- **THEN** `data/rikishi/makuuchi-current.json` preserves those values for quiz card construction

#### Scenario: Existing rikishi fields remain stable
- **WHEN** scraper/import output includes signature maneuver data
- **THEN** existing rikishi fields used by the quiz, including id, shikona, rank, heya, image path, profile URL, and snapshot date, remain available

### Requirement: Rikishi bonus scoring and celebrations
The system SHALL count main rikishi answers, rank-family bonuses, and signature-maneuver bonuses toward the rikishi session score, and zensho-yusho SHALL require a perfect score under the new maximum.

#### Scenario: Both bonuses add possible points
- **WHEN** a user correctly identifies a rikishi and answers both bonus questions correctly
- **THEN** the system awards one point for the main answer, one point for the rank-family bonus, and one point for the signature-maneuver bonus

#### Scenario: Zensho-yusho requires perfect expanded rikishi score
- **WHEN** a Makuuchi Rikishi session has ten main questions and two available bonuses per correct main answer
- **THEN** zensho-yusho is awarded only for a 30 point score

#### Scenario: Non-rikishi celebration behavior unchanged
- **WHEN** a user completes a non-rikishi deck
- **THEN** the new signature-maneuver bonus and adjusted rikishi zensho-yusho threshold do not change that deck's celebration behavior

### Requirement: Bonus result persistence compatibility
The system SHALL persist each rikishi bonus answer with a distinct card result id while continuing to exclude bonus attempts from next-card weighting and progress calculations.

#### Scenario: Distinct bonus result ids
- **WHEN** a user submits rank-family and signature-maneuver bonus answers for the same rikishi
- **THEN** the session payload includes separate card result entries identifying each bonus type

#### Scenario: Bonus results excluded from card selection weights
- **WHEN** the system calculates future rikishi card weights or deck progress
- **THEN** rank-family and signature-maneuver bonus result entries are excluded from per-card mastery calculations
