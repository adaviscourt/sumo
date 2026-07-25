import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type RawRikishi = {
  sumoAssociationId: string;
  shikonaEn: string;
  shikonaJp?: string;
  heya?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  currentRank: string;
  imagePath?: string;
  profileUrl: string;
  snapshotDate: string;
  signatureManeuver?: string;
};

type Snapshot = {
  fetchedAt: string;
  source: string;
  rikishi: RawRikishi[];
};

function parseLatestFile(files: string[]): string | null {
  const timestamped = files
    .filter((file) => /^makuuchi-\d{8}-\d{6}\.json$/.test(file))
    .sort();

  if (timestamped.length > 0) {
    return timestamped[timestamped.length - 1];
  }

  const fallback = files.filter((file) => file === "makuuchi-sample.json");
  return fallback.length > 0 ? fallback[0] : null;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const rawDir = join(root, "data", "rikishi", "raw");
  const outDir = join(root, "data", "rikishi");

  const files = await readdir(rawDir);
  const latest = parseLatestFile(files);

  if (!latest) {
    throw new Error("No raw rikishi snapshot found in data/rikishi/raw");
  }

  const raw = await readFile(join(rawDir, latest), "utf8");
  const parsed = JSON.parse(raw) as Snapshot;

  if (!Array.isArray(parsed.rikishi) || parsed.rikishi.length === 0) {
    throw new Error("Snapshot has no rikishi rows");
  }

  const current = {
    fetchedAt: parsed.fetchedAt,
    source: parsed.source,
    rikishi: parsed.rikishi
  };

  await mkdir(outDir, { recursive: true });
  const outputFile = join(outDir, "makuuchi-current.json");
  await writeFile(outputFile, JSON.stringify(current, null, 2), "utf8");

  console.log(`Prepared ${parsed.rikishi.length} rikishi in data/rikishi/makuuchi-current.json from ${latest}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
