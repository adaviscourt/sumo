import Link from "next/link";

export function HeaderAuth() {
  return (
    <Link
      href="/account"
      className="flex flex-col items-end gap-0.5 text-ink/40 transition-colors hover:text-ink/70"
    >
      <span className="text-[10px] tracking-widest" aria-hidden="true">道場</span>
      <span className="text-xs font-medium tracking-wide">My Dōjō</span>
    </Link>
  );
}
