export const OFFICIAL_HONBASHO_RESULTS_URL = "https://www.sumo.or.jp/EnHonbashoMain";

export type HonbashoScheduleEntry = {
  id: string;
  name: string;
  startsOn: `${number}-${number}-${number}`;
  endsOn: `${number}-${number}-${number}`;
  resultsUrl: typeof OFFICIAL_HONBASHO_RESULTS_URL;
};

export const HONBASHO_SCHEDULE: readonly HonbashoScheduleEntry[] = [
  {
    id: "2026-hatsu",
    name: "Hatsu basho",
    startsOn: "2026-01-11",
    endsOn: "2026-01-25",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2026-haru",
    name: "Haru basho",
    startsOn: "2026-03-08",
    endsOn: "2026-03-22",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2026-natsu",
    name: "Natsu basho",
    startsOn: "2026-05-10",
    endsOn: "2026-05-24",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2026-nagoya",
    name: "Nagoya basho",
    startsOn: "2026-07-12",
    endsOn: "2026-07-26",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2026-aki",
    name: "Aki basho",
    startsOn: "2026-09-13",
    endsOn: "2026-09-27",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2026-kyushu",
    name: "Kyushu basho",
    startsOn: "2026-11-08",
    endsOn: "2026-11-22",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2027-hatsu",
    name: "Hatsu basho",
    startsOn: "2027-01-10",
    endsOn: "2027-01-24",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2027-haru",
    name: "Haru basho",
    startsOn: "2027-03-14",
    endsOn: "2027-03-28",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2027-natsu",
    name: "Natsu basho",
    startsOn: "2027-05-09",
    endsOn: "2027-05-23",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2027-nagoya",
    name: "Nagoya basho",
    startsOn: "2027-07-11",
    endsOn: "2027-07-25",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2027-aki",
    name: "Aki basho",
    startsOn: "2027-09-12",
    endsOn: "2027-09-26",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2027-kyushu",
    name: "Kyushu basho",
    startsOn: "2027-11-14",
    endsOn: "2027-11-28",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2028-hatsu",
    name: "Hatsu basho",
    startsOn: "2028-01-09",
    endsOn: "2028-01-23",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2028-haru",
    name: "Haru basho",
    startsOn: "2028-03-12",
    endsOn: "2028-03-26",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2028-natsu",
    name: "Natsu basho",
    startsOn: "2028-05-14",
    endsOn: "2028-05-28",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2028-nagoya",
    name: "Nagoya basho",
    startsOn: "2028-07-09",
    endsOn: "2028-07-23",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2028-aki",
    name: "Aki basho",
    startsOn: "2028-09-10",
    endsOn: "2028-09-24",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  },
  {
    id: "2028-kyushu",
    name: "Kyushu basho",
    startsOn: "2028-11-12",
    endsOn: "2028-11-26",
    resultsUrl: OFFICIAL_HONBASHO_RESULTS_URL
  }
] as const;

const japanDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function toJapanLocalDateKey(date: Date): `${number}-${number}-${number}` {
  const parts = Object.fromEntries(japanDateFormatter.formatToParts(date).map((part) => [part.type, part.value]));

  return `${parts.year}-${parts.month}-${parts.day}` as `${number}-${number}-${number}`;
}

export function getActiveHonbasho(
  referenceDate: Date = new Date(),
  schedule: readonly HonbashoScheduleEntry[] = HONBASHO_SCHEDULE
): HonbashoScheduleEntry | null {
  const japanDate = toJapanLocalDateKey(referenceDate);

  return schedule.find((basho) => basho.startsOn <= japanDate && japanDate <= basho.endsOn) ?? null;
}

export function isHonbashoActive(referenceDate: Date = new Date()): boolean {
  return getActiveHonbasho(referenceDate) !== null;
}
