import Link from "next/link";

export const metadata = {
  title: "About & Sources — Sumo Trainer",
  description: "Data sources and credits for Sumo Trainer"
};

export default function AboutPage() {
  return (
    <div className="space-y-12 max-w-2xl">
      <div className="space-y-2">
        <p className="text-xs tracking-widest text-ink/30" aria-hidden="true">について</p>
        <h1 className="text-2xl font-bold tracking-wide">About Sumo Trainer</h1>
        <p className="text-ink/70 leading-relaxed">
          Sumo Trainer is a flashcard quiz for curious newcomers to professional sumo. Each session
          draws 10 cards from a deck — terms, techniques, or active makuuchi rikishi — to help you
          build familiarity at your own pace.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs tracking-widest text-ink/30" aria-hidden="true">出典</p>
          <h2 className="text-lg font-semibold">Sources</h2>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="font-medium">Sumo Terms deck</h3>
            <ul className="space-y-2 text-sm text-ink/70">
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Glossary_of_sumo_terms"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink transition-colors"
                >
                  Wikipedia — Glossary of sumo terms
                </a>
                <span className="ml-2 text-ink/40">primary source for definitions and Japanese readings</span>
              </li>
              <li>
                <a
                  href="https://sumowrestling.fandom.com/wiki/Glossary_of_Sumo_Terms"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink transition-colors"
                >
                  Sumo Wrestling Wiki — Glossary of Sumo Terms
                </a>
                <span className="ml-2 text-ink/40">supplemental reference</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Kimarite deck</h3>
            <ul className="space-y-2 text-sm text-ink/70">
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Kimarite"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink transition-colors"
                >
                  Wikipedia — Kimarite
                </a>
                <span className="ml-2 text-ink/40">definitions and Japanese for all 82 recognized techniques</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Rikishi deck</h3>
            <ul className="space-y-2 text-sm text-ink/70">
              <li>
                <a
                  href="https://www.sumo.or.jp/EnSumoDataRikishi/search/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink transition-colors"
                >
                  Japan Sumo Association — Rikishi Search
                </a>
                <span className="ml-2 text-ink/40">rikishi names, ranks, heya, and official profile photos</span>
              </li>
              <li>
                <a
                  href="https://www.sumo.or.jp/EnHonbashoBanzuke/index/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink transition-colors"
                >
                  Japan Sumo Association — Official Banzuke
                </a>
                <span className="ml-2 text-ink/40">current tournament ranking list</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-sm text-ink/40 border-t border-ink/10 pt-8 space-y-1">
        <p>Sumo Trainer is an unofficial fan project and is not affiliated with the Japan Sumo Association.</p>
        <p>Rikishi data and images are sourced from the official JSA website and are the property of the Japan Sumo Association.</p>
      </div>

      <Link href="/" className="inline-block text-sm text-ink/50 hover:text-ink transition-colors">
        ← Back to decks
      </Link>
    </div>
  );
}
