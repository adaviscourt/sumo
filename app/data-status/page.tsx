import { getRikishiCurrent } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DataStatusPage() {
  const current = await getRikishiCurrent();

  return (
    <div className="space-y-4">
      <section className="card">
        <h1 className="mb-2 text-2xl font-semibold">Data Status</h1>
        <p className="text-sm text-ink/75">Rikishi records: {current.rikishi.length}</p>
        <p className="text-sm text-ink/75">Last snapshot: {new Date(current.fetchedAt).toLocaleString()}</p>
      </section>
      <section className="card text-sm text-ink/75">
        <p>Refresh workflow:</p>
        <pre className="mt-2 overflow-x-auto rounded bg-ink/95 p-3 text-rice">npm run scrape:rikishi{"\n"}npm run import:rikishi</pre>
      </section>
    </div>
  );
}
