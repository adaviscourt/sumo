export type DeckSlug = "terms" | "kimarite" | "rikishi";

export type CardBonusMeta = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  detail?: {
    term: string;
    japanese?: string;
    summary?: string;
  };
};

export type CardMeta = {
  japanese?: string;
  romanized?: string;
  meaning?: string;
  imagePath?: string;
  rank?: string;
  heya?: string;
  profileUrl?: string;
  bonusPrompt?: string;
  bonusChoices?: string[];
  bonusAnswer?: string;
  bonuses?: CardBonusMeta[];
};

export type NextCardPayload = {
  cardId: string;
  deckSlug: DeckSlug;
  prompt: string;
  choices: Array<{ id: string; label: string }>;
  meta: CardMeta;
};
