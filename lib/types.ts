export type DeckSlug = "terms" | "kimarite" | "rikishi" | "yokozuna" | "heya";

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
};

export type NextCardPayload = {
  cardId: string;
  deckSlug: DeckSlug;
  prompt: string;
  choices: Array<{ id: string; label: string }>;
  meta: CardMeta;
};
